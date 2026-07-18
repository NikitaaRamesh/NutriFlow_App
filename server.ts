/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error(
        "GEMINI_API_KEY is not configured. Please add your API key in the Secrets panel."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// POST endpoint to generate meal plans and weekly grocery manifests
app.post("/api/generate-plan", async (req, res) => {
  try {
    const {
      weightKg,
      heightCm,
      age,
      gender,
      goal,
      dietType,
      dislikedIngredients,
      stepsGoal,
      stepsLogged,
      activityLevel,
      mealsCount,
    } = req.body;

    // Server-side validation of inputs
    if (
      !weightKg ||
      !heightCm ||
      !age ||
      !gender ||
      !goal ||
      !dietType ||
      !mealsCount
    ) {
      return res.status(400).json({ error: "Missing required biometrics or settings." });
    }

    const ai = getGeminiClient();

    // Constructing a detailed system instruction for the nutritionist agent
    const systemInstruction = `You are an expert AI Nutritionist and Integration Orchestrator. 
Your goal is to analyze user biometrics, fitness targets, and health application telemetry to generate hyper-personalized, dynamic daily meal plans and structured grocery manifests.

Follow these strict constraints:
1. **Absolute Ingredient Exclusion**: NEVER include user-disliked ingredients in any recipe or grocery list under any condition. If the user dislikes an ingredient, substitute it with a healthy alternative conforming to their diet type.
2. **No Placeholders**: All ingredient metrics must be explicit quantities, never ranges or vague approximations (e.g., use "15g Olive Oil", never "a splash of oil" or "olive oil to taste").
3. **Quantizable Text**: Ensure all item names in the grocery list use standard retail terminology rather than recipe descriptions (e.g., "Fresh Organic Spinach" instead of "chopped spinach leaves") to minimize downstream e-commerce automated ordering plugin mapping errors.
4. **Dynamic Activity Calibration**:
   - Ingest and evaluate step/activity logs.
   - Adjust caloric deficits or surpluses based on real-time activity metrics.
   - Calorie Target Guidelines:
     - Weight Loss: Calculate TDEE and apply a 500 kcal deficit, further calibrated by (stepsLogged - stepsGoal) * 0.04 kcal.
     - Muscle Building: Calculate TDEE and apply a 300 kcal surplus, calibrated with extra protein.
     - Maintenance / Athletic: Balance intake with calories burned.
   - Adjust macro proportions appropriately (e.g., higher carbs/protein for highly active muscle building).
5. **Cumulative Aggregation**: Consolidate the 7-day meal plan (multiplying the daily portion of ingredients by 7) into a unified, zero-waste weekly grocery list with cumulative quantities grouped by clean e-commerce categories (Produce, Pantry, Dairy, Meat/Protein, Seafood, Bakery, etc.).`;

    // Constructing the user prompt using biometrics and step counts
    const prompt = `Analyze the following user biometric and activity profiles to construct an explicit meal plan and weekly grocery list:

**User Profile:**
- **Age:** ${age} years old
- **Gender:** ${gender}
- **Weight:** ${weightKg} kg
- **Height:** ${heightCm} cm
- **Fitness Target:** ${goal} (e.g. weight loss, muscle building, maintenance, athletic)
- **Diet Type:** ${dietType}
- **Disliked Ingredients (STRICT EXCLUSION LIST):** ${
      dislikedIngredients && dislikedIngredients.length > 0
        ? dislikedIngredients.join(", ")
        : "None"
    }

**Real-Time Telemetry & Activity Logs:**
- **Logged Steps Today:** ${stepsLogged} steps
- **Daily Steps Goal:** ${stepsGoal} steps
- **General Activity Level:** ${activityLevel}
- **Meals Scheduled Per Day:** ${mealsCount} (Generate exactly this number of meals in the dailyPlan)

Please structure your response exactly to the schema specified, ensuring:
- All ingredient amounts are strictly numeric weights in grams ('g') or volumes in milliliters ('ml').
- The weekly grocery manifest categories must be clean retail groups (e.g. Produce, Meat & Poultry, Dairy, Pantry, Seafood, Bakery, etc.) and item search terms must represent retail product packages (e.g. "Fat Free Greek Yogurt", "Rolled Oats", "Skinless Chicken Breast").
- All matching ingredient counts across the ${mealsCount} meals must be aggregated, multiplied by 7 (for a full week), and combined into single line items in the weekly manifest with cumulative quantities.`;

    // Strict schema matching the Daily Meal Plan and Weekly Grocery Manifest
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        dailyPlan: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING, description: "Day of the meal plan, e.g. Monday" },
            target_metrics: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.INTEGER, description: "Total calibrated daily calories" },
                protein_g: { type: Type.INTEGER, description: "Total daily protein in grams" },
                carbs_g: { type: Type.INTEGER, description: "Total daily carbs in grams" },
                fats_g: { type: Type.INTEGER, description: "Total daily fats in grams" },
              },
              required: ["calories", "protein_g", "carbs_g", "fats_g"],
            },
            meals: {
              type: Type.ARRAY,
              description: "The list of daily meals, matching the user requested meal count",
              items: {
                type: Type.OBJECT,
                properties: {
                  meal_number: { type: Type.INTEGER },
                  type: { type: Type.STRING, description: "e.g. Breakfast, Lunch, Dinner, Snack" },
                  time_window: { type: Type.STRING, description: "e.g. 08:30 AM - 09:00 AM" },
                  recipe_name: { type: Type.STRING },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      p: { type: Type.INTEGER, description: "Protein in grams" },
                      c: { type: Type.INTEGER, description: "Carbs in grams" },
                      f: { type: Type.INTEGER, description: "Fats in grams" },
                    },
                    required: ["p", "c", "f"],
                  },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Retail term for the ingredient" },
                        amount: { type: Type.INTEGER, description: "Numeric quantity" },
                        unit: { type: Type.STRING, description: "Only 'g' or 'ml'" },
                      },
                      required: ["name", "amount", "unit"],
                    },
                  },
                  instructions: { type: Type.STRING, description: "Short culinary step-by-step instructions" },
                },
                required: [
                  "meal_number",
                  "type",
                  "time_window",
                  "recipe_name",
                  "macros",
                  "ingredients",
                  "instructions",
                ],
              },
            },
          },
          required: ["day", "target_metrics", "meals"],
        },
        weeklyManifest: {
          type: Type.OBJECT,
          properties: {
            week_start: { type: Type.STRING, description: "Date of the week start, e.g. 2026-07-20" },
            automated_order_payload: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "e.g. Produce, Pantry, Dairy, Meat/Protein" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        sku_search_term: { type: Type.STRING, description: "Retail search term, e.g. Rolled Oats" },
                        total_quantity: { type: Type.INTEGER, description: "Cumulative weekly quantity" },
                        unit: { type: Type.STRING, description: "g or ml" },
                      },
                      required: ["sku_search_term", "total_quantity", "unit"],
                    },
                  },
                },
                required: ["category", "items"],
              },
            },
          },
          required: ["week_start", "automated_order_payload"],
        },
      },
      required: ["dailyPlan", "weeklyManifest"],
    };

    // Generating Content from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2, // low temperature to ensure schema compliance and consistent macros
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from meal planner AI service.");
    }

    const mealData = JSON.parse(resultText);
    return res.json(mealData);
  } catch (error: any) {
    console.error("AI Generation failed:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during meal planning generation.",
    });
  }
});

// Start server and handle Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamically import Vite only in development mode
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
