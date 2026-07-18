/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HealthInputs {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  goal: 'weight-loss' | 'muscle-building' | 'maintenance' | 'athletic';
  dietType: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';
  dislikedIngredients: string[];
  stepsGoal: number;
  stepsLogged: number;
  activityLevel: 'sedentary' | 'active' | 'highly-active';
  mealsCount: number;
}

export interface TargetMetrics {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Meal {
  meal_number: number;
  type: string; // e.g. "Breakfast", "Lunch", "Dinner", "Snack"
  time_window: string; // e.g. "08:30 AM - 09:00 AM"
  recipe_name: string;
  macros: {
    p: number;
    c: number;
    f: number;
  };
  ingredients: Ingredient[];
  instructions: string;
}

export interface DailyMealPlan {
  day: string;
  target_metrics: TargetMetrics;
  meals: Meal[];
}

export interface GroceryItem {
  sku_search_term: string;
  total_quantity: number;
  unit: string;
}

export interface GroceryCategory {
  category: string;
  items: GroceryItem[];
}

export interface WeeklyGroceryManifest {
  week_start: string;
  automated_order_payload: GroceryCategory[];
}

export interface PlannerResponse {
  dailyPlan: DailyMealPlan;
  weeklyManifest: WeeklyGroceryManifest;
}
