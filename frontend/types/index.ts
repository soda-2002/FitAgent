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

export interface DailyLog {
  id: number;
  user_id: number;
  weight?: number;
  mood?: string;
  workout_done?: boolean;
  sleep_hours?: number;
  summary?: string;
  created_at: string;
}

export interface DashboardResponse {
  profile?: {
    height?: number;
    weight?: number;
    target_weight?: number;
    goal?: string;
  } | null;
  today: {
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    food_logs_count: number;
  };
  week: {
    avg_calories: number;
    avg_protein: number;
    food_logs_count: number;
    workout_plan_exists: boolean;
    daily_logs_count: number;
  };
  suggestion: string;
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
  reps: number | string;
  note?: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  duration?: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlanResponse {
  user_id: number;
  plan: WorkoutDay[];
  note?: string;
  summary?: string;
}

export interface AgentChatResponse {
  reply: string;
  note?: string;
  used_context?: {
    has_profile: boolean;
    food_logs_count: number;
    daily_logs_count: number;
    has_workout_plan: boolean;
  };
}

export interface WeekReportResponse {
  report: {
    summary: string;
    diet_review: string;
    workout_review: string;
    problems: string[];
    next_week_plan: string[];
  };
  used_context: {
    food_logs_count: number;
    daily_logs_count: number;
    has_workout_plan: boolean;
  };
}
