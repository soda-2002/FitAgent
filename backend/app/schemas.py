from __future__ import annotations

from datetime import datetime
from datetime import date as DateType
from typing import Optional, List, Any
from pydantic import BaseModel


# ── User ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    goal: Optional[str] = None
    target_weight: Optional[float] = None
    training_level: Optional[str] = None
    weekly_training_days: Optional[int] = None
    diet_preference: Optional[str] = None


class UserRead(UserCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Food ──────────────────────────────────────────────────────────────────────

class FoodItem(BaseModel):
    name: str
    estimated_weight: Optional[str] = None
    calories: float
    protein: float
    carbs: float
    fat: float


class FoodTextAnalyzeRequest(BaseModel):
    user_id: int
    text: str


class FoodAnalyzeResponse(BaseModel):
    foods: List[FoodItem]
    total_calories: float
    suggestion: str
    confidence: Optional[str] = None


class FoodLogCreate(BaseModel):
    user_id: int
    food_name: str
    estimated_weight: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    date: Optional[DateType] = None
    source: str = "manual"


class FoodLogRead(FoodLogCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Daily logs ────────────────────────────────────────────────────────────────

class DailyLogCreate(BaseModel):
    user_id: int
    weight: Optional[float] = None
    mood: Optional[str] = None
    workout_done: Optional[bool] = None
    sleep_hours: Optional[float] = None
    summary: Optional[str] = None


class DailyLogRead(DailyLogCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardProfile(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    target_weight: Optional[float] = None
    goal: Optional[str] = None


class DashboardTodayStats(BaseModel):
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    food_logs_count: int


class DashboardWeekStats(BaseModel):
    avg_calories: float
    avg_protein: float
    food_logs_count: int
    workout_plan_exists: bool
    daily_logs_count: int


class DashboardResponse(BaseModel):
    profile: Optional[DashboardProfile] = None
    today: DashboardTodayStats
    week: DashboardWeekStats
    suggestion: str


# ── Meal ──────────────────────────────────────────────────────────────────────

class MealPlanRequest(BaseModel):
    user_id: int
    ingredients: str
    preference: Optional[str] = None


class MealItem(BaseModel):
    name: str
    calories: float
    protein: float
    difficulty: str
    steps: List[str]
    reason: str


class MealPlanResponse(BaseModel):
    user_id: int
    meals: List[MealItem]
    suggestion: str


# ── Workout ───────────────────────────────────────────────────────────────────

class WorkoutPlanRequest(BaseModel):
    user_id: int


class WorkoutDay(BaseModel):
    day: str
    focus: str
    duration: Optional[str] = None
    exercises: List[dict]


class WorkoutPlanResponse(BaseModel):
    user_id: int
    plan: List[WorkoutDay]
    note: Optional[str] = None
    summary: Optional[str] = None


class WorkoutPlanRead(BaseModel):
    id: int
    user_id: int
    plan_json: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Agent ─────────────────────────────────────────────────────────────────────

class AgentChatRequest(BaseModel):
    user_id: int
    message: str


class AgentChatResponse(BaseModel):
    reply: str
    note: Optional[str] = None
    used_context: Optional[dict[str, Any]] = None


class WeekReportRequest(BaseModel):
    user_id: int


class WeekReportContent(BaseModel):
    summary: str
    diet_review: str
    workout_review: str
    problems: List[str]
    next_week_plan: List[str]


class WeekReportResponse(BaseModel):
    report: WeekReportContent
    used_context: dict[str, Any]
