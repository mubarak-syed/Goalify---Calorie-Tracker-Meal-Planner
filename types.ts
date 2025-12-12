
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export enum Goal {
  CUT = 'Cut (Lose Fat)',
  MAINTAIN = 'Maintain',
  BULK = 'Bulk (Build Muscle)'
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentary (Office Job)',
  LIGHT = 'Lightly Active (1-3 days/week)',
  MODERATE = 'Moderately Active (3-5 days/week)',
  VERY = 'Very Active (Athlete)'
}

export enum CookingSkill {
  NOVICE = 'Microwave Master',
  INTERMEDIATE = 'Home Cook',
  ADVANCED = 'Chef Level'
}

export interface UserProfile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: Gender;
  goal: Goal;
  location: string; 
  // Advanced Fields
  activityLevel: ActivityLevel;
  sleepHours: number;
  stressLevel: 'Low' | 'Medium' | 'High';
  cookingSkill: CookingSkill;
  dietaryRestrictions: string[];
  preferredCuisines: string[];
  comfortFoods: string;
  // Calculated
  dailyCalories: number;
  dailyProtein: number; // g
}

export interface MacroSplit {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IngredientDetail {
  name: string;
  amount: string;
  emoji?: string;
}

export interface StepDetail {
  title: string;
  description: string;
  emoji?: string;
}

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  description: string;
  ingredients: string[]; 
  detailedIngredients?: IngredientDetail[]; 
  steps?: StepDetail[]; 
  prepTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  emoji?: string;
  author?: {
    name: string;
    handle: string;
    emoji: string;
  };
  isCheat?: boolean;
}

export interface DayPlan {
  meals: Meal[];
  totalCaloriesConsumed: number;
  remainingCalories: number;
}

export interface MapPlace {
  title: string;
  uri: string;
  address?: string;
  rating?: string;
}

export interface SearchResult {
  title: string;
  uri: string;
}

export interface AIResponse {
  text: string;
  places?: MapPlace[];
  searchLinks?: SearchResult[];
}

export interface CookingStep {
  title: string;
  description: string;
  image?: string;
}

export interface RecipeSection {
  name: string;
  steps: CookingStep[];
  ingredients: string[];
}

export interface CookingGuide {
  sections: RecipeSection[];
  tips: string[];
  audioIntro: string;
}

// --- Workout Types ---
export interface Exercise {
  name: string;
  instruction: string;
  reps: string;
  emoji: string;
}

export interface WorkoutRound {
  name: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  day: string; // e.g., "Monday"
  title: string;
  description: string;
  rounds: WorkoutRound[];
  restDay?: boolean;
}

export interface WorkoutLog {
  id: string;
  exerciseName: string;
  durationSeconds: number;
  caloriesBurned: number;
  timestamp: number;
}
