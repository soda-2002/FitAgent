export interface UserProfile {
  id?: number;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  goal?: string;
  target_weight?: number;
  training_level?: string;
  weekly_training_days?: number;
  diet_preference?: string;
  created_at?: string;
}

export interface FoodItem {
  name: string;
  estimated_weight?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodAnalyzeResponse {
  foods: FoodItem[];
  total_calories: number;
  suggestion: string;
  confidence?: string;
}

export interface FoodLog {
  id: number;
  user_id: number;
  food_name: string;
  estimated_weight?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  date?: string;
  source: string;
  created_at: string;
}

export interface MealItem {
  name: string;
  calories: number;
  protein: number;
  difficulty: string;
  steps: string[];
  reason: string;
}

export interface MealPlanResponse {
  user_id: number;
  meals: MealItem[];
  suggestion: string;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlanResponse {
  user_id: number;
  plan: WorkoutDay[];
  note: string;
}

export interface AgentChatResponse {
  reply: string;
  note: string;
}
