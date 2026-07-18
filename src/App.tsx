/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Apple,
  Sparkles,
  TrendingUp,
  Plus,
  Trash2,
  Check,
  Flame,
  Scale,
  Dumbbell,
  Heart,
  ShoppingCart,
  Utensils,
  Download,
  Copy,
  FileJson,
  Zap,
  Info,
  Calendar
} from "lucide-react";
import { HealthInputs, DailyMealPlan, WeeklyGroceryManifest } from "./types";

const LOADING_MESSAGES = [
  "Synchronizing health application telemetry and activity logs...",
  "Calibrating personalized baseline metabolism (Mifflin-St Jeor)...",
  "Adjusting meal energy density for steps and active calorie expenditure...",
  "Applying absolute ingredient exclusions to guard your preferences...",
  "Generating meal timeline and precise culinary prep overview...",
  "Aggregating 7 days of raw ingredients into a zero-waste grocery list...",
  "Formatting structured SKU search payload for e-commerce plugins..."
];

export default function App() {
  // 1. Core State
  const [inputs, setInputs] = useState<HealthInputs>({
    weightKg: 75,
    heightCm: 178,
    age: 28,
    gender: "male",
    goal: "weight-loss",
    dietType: "standard",
    dislikedIngredients: ["Cilantro", "Mushrooms"],
    stepsGoal: 10000,
    stepsLogged: 8400,
    activityLevel: "active",
    mealsCount: 3
  });

  const [dislikeInput, setDislikeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [dailyPlan, setDailyPlan] = useState<DailyMealPlan | null>(null);
  const [weeklyManifest, setWeeklyManifest] = useState<WeeklyGroceryManifest | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<"meals" | "grocery" | "ecommerce">("meals");
  const [copied, setCopied] = useState(false);
  const [estimatedCalories, setEstimatedCalories] = useState(2000);

  // 2. Real-time TDEE and target calories approximation
  useEffect(() => {
    // Mifflin-St Jeor BMR approximation
    let bmr = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * inputs.age;
    if (inputs.gender === "male") {
      bmr += 5;
    } else if (inputs.gender === "female") {
      bmr -= 161;
    } else {
      bmr -= 80; // Other/average
    }

    // Activity multiplier
    let factor = 1.2;
    if (inputs.activityLevel === "active") factor = 1.45;
    if (inputs.activityLevel === "highly-active") factor = 1.7;

    let tdee = bmr * factor;

    // Additional step calibration (approx 40 calories burned per 1,000 steps)
    const stepDiff = inputs.stepsLogged - 5000;
    if (stepDiff > 0) {
      tdee += (stepDiff / 1000) * 40;
    }

    // Goal adjustments
    let target = tdee;
    if (inputs.goal === "weight-loss") {
      target -= 500;
    } else if (inputs.goal === "muscle-building") {
      target += 300;
    } else if (inputs.goal === "athletic") {
      target += 200;
    }

    setEstimatedCalories(Math.round(target));
  }, [inputs]);

  // Loading message rotation
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // 3. Handlers
  const handleAddDislike = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = dislikeInput.trim();
    if (clean && !inputs.dislikedIngredients.some((i) => i.toLowerCase() === clean.toLowerCase())) {
      setInputs((prev) => ({
        ...prev,
        dislikedIngredients: [...prev.dislikedIngredients, clean]
      }));
      setDislikeInput("");
    }
  };

  const handleRemoveDislike = (item: string) => {
    setInputs((prev) => ({
      ...prev,
      dislikedIngredients: prev.dislikedIngredients.filter((i) => i !== item)
    }));
  };

  const generateMealPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(inputs)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate plan. Please try again.");
      }

      const data = await res.json();
      setDailyPlan(data.dailyPlan);
      setWeeklyManifest(data.weeklyManifest);
      setActiveTab("meals");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPayload = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = (data: any, fileName: string) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper mock pre-population for health sync simulation
  const handleSimulateSync = () => {
    const weights = [68, 72, 75, 80, 85, 90];
    const logged = [6500, 9200, 11400, 14200, 4100, 12800];
    const goals = [10000, 12000, 8000, 10000];

    const randomWeight = weights[Math.floor(Math.random() * weights.length)];
    const randomStepsLogged = logged[Math.floor(Math.random() * logged.length)];
    const randomStepsGoal = goals[Math.floor(Math.random() * goals.length)];

    setInputs((prev) => ({
      ...prev,
      weightKg: randomWeight,
      stepsLogged: randomStepsLogged,
      stepsGoal: randomStepsGoal
    }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#f27d26]/20 selection:text-[#f27d26]">
      {/* Upper Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#f27d26]/10 p-2.5 rounded-xl text-[#f27d26] border border-[#f27d26]/20">
              <Apple className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg md:text-xl tracking-tight uppercase text-white">
                Nutri<span className="text-[#f27d26] underline underline-offset-4 decoration-1">Flow</span>
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-sans mt-0.5 font-semibold">
                AI Meal Planner & Grocery Orchestrator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateSync}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-[#1a1a1a] text-[#f27d26] hover:bg-[#252525] transition-colors rounded-lg border border-[#333]"
              title="Simulates real-time health data stream injection"
              id="simulate-sync-btn"
            >
              <Zap className="w-3.5 h-3.5" />
              Sync Health Telemetry
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ACTIVE [2.4ms]
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Control Panel */}
          <section className="lg:col-span-5 flex flex-col gap-6" id="input-control-panel">
            <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a] shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-[#f27d26]" />
                <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-white">1. User Biometrics</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Weight (kg)</label>
                  <input
                    type="number"
                    value={inputs.weightKg}
                    onChange={(e) => setInputs({ ...inputs, weightKg: Number(e.target.value) })}
                    className="w-full bg-[#111] border border-[#222] rounded-lg py-2 px-3 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#f27d26] focus:bg-[#151515] transition-all font-mono font-semibold"
                    min="30"
                    max="200"
                    id="weight-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Height (cm)</label>
                  <input
                    type="number"
                    value={inputs.heightCm}
                    onChange={(e) => setInputs({ ...inputs, heightCm: Number(e.target.value) })}
                    className="w-full bg-[#111] border border-[#222] rounded-lg py-2 px-3 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#f27d26] focus:bg-[#151515] transition-all font-mono font-semibold"
                    min="100"
                    max="250"
                    id="height-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Age (years)</label>
                  <input
                    type="number"
                    value={inputs.age}
                    onChange={(e) => setInputs({ ...inputs, age: Number(e.target.value) })}
                    className="w-full bg-[#111] border border-[#222] rounded-lg py-2 px-3 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#f27d26] focus:bg-[#151515] transition-all font-mono font-semibold"
                    min="1"
                    max="120"
                    id="age-input"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Gender Biological Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setInputs({ ...inputs, gender: g })}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                        inputs.gender === g
                          ? "bg-[#f27d26] text-black border-[#f27d26]"
                          : "bg-[#111] text-[#e0e0e0] border-[#222] hover:bg-[#1a1a1a]"
                      }`}
                      id={`gender-btn-${g}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Nutrition targets and Diet selection */}
            <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a] shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-[#f27d26]" />
                <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-white">2. Goals & Nutrition</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Fitness Target</label>
                  <select
                    value={inputs.goal}
                    onChange={(e: any) => setInputs({ ...inputs, goal: e.target.value })}
                    className="w-full bg-[#111] border border-[#222] rounded-lg py-2 px-3 text-xs font-bold text-[#e0e0e0] focus:outline-none focus:border-[#f27d26] transition-all cursor-pointer"
                    id="goal-select"
                  >
                    <option value="weight-loss">Weight Loss (-500 kcal)</option>
                    <option value="muscle-building">Muscle Building (+300 kcal)</option>
                    <option value="maintenance">Weight Maintenance</option>
                    <option value="athletic">Athletic Performance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Dietary Regimen</label>
                  <select
                    value={inputs.dietType}
                    onChange={(e: any) => setInputs({ ...inputs, dietType: e.target.value })}
                    className="w-full bg-[#111] border border-[#222] rounded-lg py-2 px-3 text-xs font-bold text-[#e0e0e0] focus:outline-none focus:border-[#f27d26] transition-all cursor-pointer"
                    id="diet-select"
                  >
                    <option value="standard">Standard (No Restrictions)</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Ketogenic (Very Low Carb)</option>
                    <option value="paleo">Paleo Diet</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Meals Scheduled Daily</label>
                  <span className="text-xs font-bold text-[#f27d26] bg-[#f27d26]/10 border border-[#f27d26]/20 px-2 py-0.5 rounded">
                    {inputs.mealsCount} meals
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="5"
                  step="1"
                  value={inputs.mealsCount}
                  onChange={(e) => setInputs({ ...inputs, mealsCount: Number(e.target.value) })}
                  className="w-full accent-[#f27d26] bg-[#222] rounded-lg appearance-none h-2 cursor-pointer"
                  id="meals-count-slider"
                />
              </div>
            </div>

            {/* Health app real-time activity metrics */}
            <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a] shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#f27d26]/5 to-transparent opacity-10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#f27d26]" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-white">3. Telemetry & Steps</h2>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-500 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/30">
                  Live Sync
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Logged Steps Today</label>
                    <span className="text-xs font-mono font-bold text-[#e0e0e0]">
                      {inputs.stepsLogged.toLocaleString()} steps
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25000"
                    step="500"
                    value={inputs.stepsLogged}
                    onChange={(e) => setInputs({ ...inputs, stepsLogged: Number(e.target.value) })}
                    className="w-full accent-[#f27d26] bg-[#222] rounded-lg appearance-none h-2 cursor-pointer"
                    id="steps-logged-slider"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Steps Goal</label>
                    <input
                      type="number"
                      value={inputs.stepsGoal}
                      onChange={(e) => setInputs({ ...inputs, stepsGoal: Number(e.target.value) })}
                      className="w-full bg-[#111] border border-[#222] rounded-lg py-1.5 px-3 text-xs text-[#e0e0e0] focus:outline-none focus:border-[#f27d26] font-mono font-semibold"
                      min="1000"
                      max="50000"
                      id="steps-goal-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Activity Level</label>
                    <select
                      value={inputs.activityLevel}
                      onChange={(e: any) => setInputs({ ...inputs, activityLevel: e.target.value })}
                      className="w-full bg-[#111] border border-[#222] rounded-lg py-1.5 px-2 text-xs text-[#e0e0e0] focus:outline-none focus:border-[#f27d26] font-semibold"
                      id="activity-level-select"
                    >
                      <option value="sedentary">Sedentary (No workouts)</option>
                      <option value="active">Active (Moderate exercise)</option>
                      <option value="highly-active">Highly Active (Heavy workouts)</option>
                    </select>
                  </div>
                </div>

                {/* Instant Dynamic Metric Estimation Gauge */}
                <div className="bg-[#111] rounded-xl p-4 border border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#f27d26]/10 p-2 rounded-lg text-[#f27d26] border border-[#f27d26]/20">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                        Estimated Calorie Budget
                      </p>
                      <p className="text-lg font-display font-bold text-white">
                        {estimatedCalories} <span className="text-xs font-normal text-gray-400">kcal / day</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 block font-bold font-mono">Steps Ratio</span>
                    <span className={`text-xs font-mono font-bold ${inputs.stepsLogged >= inputs.stepsGoal ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {Math.round((inputs.stepsLogged / inputs.stepsGoal) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Absolute Exclusions / Dislikes tag system */}
            <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a] shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-white">4. Ingredient Guardrails</h2>
                </div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-950/30 border border-rose-900/40 px-1.5 py-0.5 rounded">
                  Strict Exclusion
                </span>
              </div>
              <p className="text-xs text-gray-400 opacity-80 mb-4">
                These ingredients will be programmatically zeroed out from all generated recipes and e-commerce shopping manifests.
              </p>

              <form onSubmit={handleAddDislike} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Peanuts, Pork, Soy, Cilantro"
                  value={dislikeInput}
                  onChange={(e) => setDislikeInput(e.target.value)}
                  className="flex-1 bg-[#111] border border-[#222] rounded-lg py-2 px-3 text-xs text-[#e0e0e0] focus:outline-none focus:border-[#f27d26] focus:bg-[#151515] transition-all font-medium"
                  id="dislike-input"
                />
                <button
                  type="submit"
                  className="bg-[#f27d26] hover:bg-[#ff8c3a] text-black rounded-lg px-4 text-xs font-bold uppercase tracking-wider transition-colors"
                  id="add-dislike-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </form>

              {/* Tag display list */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <AnimatePresence>
                  {inputs.dislikedIngredients.map((item) => (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      key={item}
                      className="inline-flex items-center gap-1 bg-rose-950/30 text-rose-300 border border-rose-900/40 rounded-lg px-2 py-1 text-xs font-semibold"
                      id={`dislike-tag-${item}`}
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveDislike(item)}
                        className="text-rose-400 hover:text-rose-250 transition-colors focus:outline-none font-bold"
                      >
                        &times;
                      </button>
                    </motion.span>
                  ))}
                  {inputs.dislikedIngredients.length === 0 && (
                    <span className="text-xs text-gray-500 italic">No restrictions set. Standard recipes will generate.</span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Error view */}
            {error && (
              <div className="bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs p-4 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Generation Error</p>
                  <p className="mt-0.5 opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Major CTA Button */}
            <button
              onClick={generateMealPlan}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl font-display font-bold tracking-widest text-xs uppercase shadow-md transition-all flex items-center justify-center gap-2 ${
                loading
                  ? "bg-[#111] text-gray-500 border border-[#222] cursor-not-allowed"
                  : "bg-[#f27d26] hover:bg-[#ff8c3a] text-black active:scale-[0.99] hover:shadow-lg hover:shadow-[#f27d26]/10"
              }`}
              id="generate-plan-btn"
            >
              <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Calibrating & Building Plan..." : "Generate Personalized Plan"}
            </button>
          </section>

          {/* RIGHT COLUMN: Output display area */}
          <section className="lg:col-span-7" id="output-display-panel">
            {loading ? (
              /* Loading screen */
              <div className="bg-[#0a0a0a] rounded-3xl p-12 border border-[#1a1a1a] shadow-lg text-center min-h-[450px] flex flex-col items-center justify-center animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-[#111] border-t-[#f27d26] animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Apple className="w-6 h-6 text-[#f27d26] animate-pulse" />
                  </div>
                </div>

                <h3 className="font-display font-semibold text-lg text-white tracking-tight mb-2">
                  NutriFlow AI Orchestration
                </h3>
                
                <div className="max-w-md h-12 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMessageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-[#f27d26] font-bold tracking-widest uppercase font-mono"
                    >
                      {LOADING_MESSAGES[loadingMessageIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <p className="text-xs text-gray-500 mt-6 max-w-sm mx-auto leading-relaxed">
                  Gemini is assembling explicit recipes matching your calorie deficit target, steps logged, and ingredient restrictions.
                </p>
              </div>
            ) : dailyPlan && weeklyManifest ? (
              /* Success results view */
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Result Control Toolbar & Tabs */}
                <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-[#1a1a1a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex bg-[#111] p-1 rounded-xl border border-[#222]">
                    <button
                      onClick={() => setActiveTab("meals")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === "meals"
                          ? "bg-[#f27d26] text-black shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                      id="tab-meals-btn"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      Daily Meals
                    </button>
                    <button
                      onClick={() => setActiveTab("grocery")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === "grocery"
                          ? "bg-[#f27d26] text-black shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                      id="tab-grocery-btn"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Weekly Grocery
                    </button>
                    <button
                      onClick={() => setActiveTab("ecommerce")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === "ecommerce"
                          ? "bg-[#f27d26] text-black shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                      id="tab-ecommerce-btn"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      E-Commerce API
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadJSON({ dailyPlan, weeklyManifest }, "nutriflow_plan.json")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] text-[#f27d26] transition-colors rounded-lg border border-[#333]"
                      title="Download overall full plan JSON"
                      id="download-plan-json-btn"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT: Daily Meal Plan */}
                {activeTab === "meals" && (
                  <div className="space-y-6">
                    {/* Header metrics */}
                    <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] text-white rounded-2xl p-6 shadow-md relative overflow-hidden border border-[#222]">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-[#f27d26]/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] tracking-widest uppercase font-extrabold bg-[#f27d26]/10 text-[#f27d26] border border-[#f27d26]/20 px-2.5 py-1 rounded-full">
                            {dailyPlan.day} Daily Routine
                          </span>
                          <h3 className="font-serif italic font-light text-4xl mt-2 tracking-tight text-white">
                            Personalized Meal Strategy
                          </h3>
                        </div>

                        <div className="grid grid-cols-4 gap-3 bg-[#111] p-3 rounded-xl border border-[#222] shadow-inner">
                          <div className="text-center">
                            <span className="text-[8px] uppercase tracking-widest text-gray-500 block font-mono font-bold">Calories</span>
                            <span className="text-sm font-bold block font-mono mt-0.5 text-white">{dailyPlan.target_metrics.calories}</span>
                            <span className="text-[8px] text-gray-400 font-medium font-mono">kcal</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[8px] uppercase tracking-widest text-gray-500 block font-mono font-bold">Protein</span>
                            <span className="text-sm font-bold block font-mono mt-0.5 text-emerald-400">{dailyPlan.target_metrics.protein_g}</span>
                            <span className="text-[8px] text-gray-400 font-medium font-mono">g</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[8px] uppercase tracking-widest text-gray-500 block font-mono font-bold">Carbs</span>
                            <span className="text-sm font-bold block font-mono mt-0.5 text-[#f27d26]">{dailyPlan.target_metrics.carbs_g}</span>
                            <span className="text-[8px] text-gray-400 font-medium font-mono">g</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[8px] uppercase tracking-widest text-gray-500 block font-mono font-bold">Fats</span>
                            <span className="text-sm font-bold block font-mono mt-0.5 text-blue-400">{dailyPlan.target_metrics.fats_g}</span>
                            <span className="text-[8px] text-gray-400 font-medium font-mono">g</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline of Meals */}
                    <div className="space-y-6">
                      {dailyPlan.meals.map((meal) => (
                        <div
                          key={meal.meal_number}
                          className="bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] shadow-md overflow-hidden"
                        >
                          {/* Title & timing bar */}
                          <div className="bg-[#0e0e0e] border-b border-[#1a1a1a] py-3.5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#111] text-[#f27d26] font-bold text-xs px-2.5 py-0.5 rounded-lg border border-[#222]">
                                MEAL {meal.meal_number}
                              </span>
                              <h4 className="font-display font-semibold text-white text-sm">
                                {meal.type}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold font-mono text-gray-400 bg-[#111] border border-[#222] px-2 py-0.5 rounded flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-[#f27d26]" />
                                {meal.time_window}
                              </span>
                            </div>
                          </div>

                          {/* Body content */}
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                              {/* Left side: ingredients list and macros */}
                              <div className="md:col-span-5 flex flex-col gap-4">
                                <div>
                                  <h5 className="font-display font-bold text-white text-sm mb-2">
                                    {meal.recipe_name}
                                  </h5>
                                  {/* Macros badge meters */}
                                  <div className="flex gap-2">
                                    <div className="bg-[#111] border border-[#222] rounded px-2 py-1 text-center flex-1">
                                      <span className="text-[8px] font-mono text-gray-500 block font-extrabold uppercase">Protein</span>
                                      <span className="text-xs font-bold font-mono text-emerald-400">{meal.macros.p}g</span>
                                    </div>
                                    <div className="bg-[#111] border border-[#222] rounded px-2 py-1 text-center flex-1">
                                      <span className="text-[8px] font-mono text-gray-500 block font-extrabold uppercase">Carbs</span>
                                      <span className="text-xs font-bold font-mono text-[#f27d26]">{meal.macros.c}g</span>
                                    </div>
                                    <div className="bg-[#111] border border-[#222] rounded px-2 py-1 text-center flex-1">
                                      <span className="text-[8px] font-mono text-gray-500 block font-extrabold uppercase">Fats</span>
                                      <span className="text-xs font-bold font-mono text-blue-400">{meal.macros.f}g</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-[#1a1a1a] pt-3">
                                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-2 font-mono">
                                    Ingredients Needed
                                  </p>
                                  <ul className="space-y-1.5">
                                    {meal.ingredients.map((ing, idx) => (
                                      <li
                                        key={idx}
                                        className="text-xs font-semibold text-gray-300 flex justify-between items-center py-1 border-b border-dashed border-[#1a1a1a]"
                                      >
                                        <span>{ing.name}</span>
                                        <span className="text-[#f27d26] bg-[#f27d26]/10 border border-[#f27d26]/20 px-2 py-0.5 rounded font-mono text-[10px]">
                                          {ing.amount}{ing.unit}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* Right side: step instructions */}
                              <div className="md:col-span-7 bg-[#111] rounded-xl p-4 border border-[#222]">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-2 font-mono">
                                  Culinary Preparation Overview
                                </p>
                                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                  {meal.instructions}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Weekly Grocery Manifest */}
                {activeTab === "grocery" && (
                  <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a] shadow-lg space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#f27d26] uppercase tracking-wider bg-[#f27d26]/10 border border-[#f27d26]/20 px-2 py-0.5 rounded">
                          7-Day Waste Elimination
                        </span>
                        <h3 className="font-display font-bold text-lg text-white mt-1">
                          Weekly Consolidated Manifest
                        </h3>
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Week starting: <span className="font-bold text-[#f27d26]">{weeklyManifest.week_start}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {weeklyManifest.automated_order_payload.map((cat, idx) => (
                        <div key={idx} className="bg-[#111] rounded-xl p-4 border border-[#222] shadow-md">
                          <h4 className="font-display font-bold text-[#f27d26] text-xs uppercase tracking-wider mb-3 font-mono">
                            {cat.category}
                          </h4>
                          <ul className="space-y-2">
                            {cat.items.map((item, idy) => (
                              <li
                                key={idy}
                                className="bg-[#0a0a0a] border border-[#222] rounded-lg p-2.5 flex items-center justify-between shadow-xs"
                              >
                                <span className="text-xs font-semibold text-gray-300">
                                  {item.sku_search_term}
                                </span>
                                <span className="text-xs font-bold font-mono text-gray-400 bg-[#111] border border-[#222] px-2.5 py-0.5 rounded">
                                  {item.total_quantity} {item.unit}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: E-Commerce Automated Format */}
                {activeTab === "ecommerce" && (
                  <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a] shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#f27d26] uppercase tracking-wider bg-[#f27d26]/10 px-2 py-0.5 rounded border border-[#f27d26]/20">
                          Structured API Output
                        </span>
                        <h3 className="font-display font-bold text-lg text-white mt-1">
                          Downstream Automated Payload
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyPayload(weeklyManifest)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#f27d26] transition-colors rounded-lg border border-[#333]"
                          id="copy-payload-btn"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Payload Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Payload
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 opacity-80 leading-relaxed">
                      Below is the exact zero-waste aggregated grocery format compliant with automated retail ordering integrations and SKU search terminology plugins.
                    </p>

                    {/* Developer code terminal block */}
                    <div className="bg-[#111] rounded-xl p-4 font-mono text-xs text-slate-300 relative group overflow-hidden border border-[#222] shadow-inner">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold bg-slate-800 px-2 py-1 rounded">
                          JSON Schema
                        </span>
                      </div>
                      <pre className="max-h-[350px] overflow-auto select-all leading-relaxed p-1">
                        {JSON.stringify(weeklyManifest, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Initial empty/instructions state */
              <div className="bg-[#0a0a0a] rounded-3xl p-12 border border-[#1a1a1a] shadow-lg text-center min-h-[450px] flex flex-col items-center justify-center animate-fade-in">
                <div className="bg-[#f27d26]/10 p-4 rounded-2xl text-[#f27d26] border border-[#f27d26]/20 mb-4">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-lg text-white tracking-tight mb-2">
                  Awaiting Telemetry Calibration
                </h3>
                <p className="text-xs text-gray-400 opacity-80 max-w-sm mx-auto leading-relaxed">
                  Provide your biological metrics, daily step thresholds, and ingredient dislikes, then trigger generation to craft your zero-waste meal schedules and e-commerce shopping payload.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-md pt-6 border-t border-[#1a1a1a]">
                  <div className="text-center">
                    <span className="text-sm font-bold text-[#f27d26] block">Mifflin-St Jeor</span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Metabolism Engine</span>
                  </div>
                  <div className="text-center border-x border-[#1a1a1a]">
                    <span className="text-sm font-bold text-[#f27d26] block">Cumulative</span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Zero-Waste Manifests</span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-[#f27d26] block">Plugin Ready</span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Downstream Ordering</span>
                  </div>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Dynamic footer */}
      <footer className="mt-16 border-t border-[#1a1a1a] bg-[#0a0a0a] py-8 px-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Meal Planner & Grocery Orchestrator. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Statement</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Calibration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
