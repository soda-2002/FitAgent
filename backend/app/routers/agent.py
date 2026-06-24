from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, FoodLog, WorkoutPlan, DailyLog
from app.schemas import AgentChatRequest, AgentChatResponse, WeekReportRequest, WeekReportResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat/mock", response_model=AgentChatResponse)
async def chat_mock(payload: AgentChatRequest, db: AsyncSession = Depends(get_db)):
    user_result = await db.execute(select(User).where(User.id == payload.user_id))
    user = user_result.scalar_one_or_none()

    food_result = await db.execute(
        select(FoodLog).where(FoodLog.user_id == payload.user_id).order_by(FoodLog.created_at.desc()).limit(5)
    )
    recent_food = food_result.scalars().all()

    user_context = {
        "profile": {"goal": user.goal if user else None},
        "recent_food_logs": len(recent_food),
    }

    reply = await ai_service.mock_coach_chat(payload.message, user_context)
    return AgentChatResponse(
        reply=reply,
        note="Phase 1 mock. Agent tool-calling will be implemented in Phase 4.",
    )


@router.post("/chat", response_model=AgentChatResponse)
async def chat(payload: AgentChatRequest, db: AsyncSession = Depends(get_db)):
    user_result = await db.execute(select(User).where(User.id == payload.user_id))
    user = user_result.scalar_one_or_none()

    week_start_date = date.today() - timedelta(days=6)
    week_start = datetime.combine(week_start_date, time.min)

    food_result = await db.execute(
        select(FoodLog)
        .where(FoodLog.user_id == payload.user_id)
        .where(
            or_(
                FoodLog.date >= week_start_date,
                and_(FoodLog.date.is_(None), FoodLog.created_at >= week_start),
            )
        )
        .order_by(FoodLog.created_at.desc())
    )
    recent_food = food_result.scalars().all()

    daily_result = await db.execute(
        select(DailyLog)
        .where(DailyLog.user_id == payload.user_id)
        .order_by(DailyLog.created_at.desc())
        .limit(7)
    )
    recent_daily = daily_result.scalars().all()

    workout_result = await db.execute(
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == payload.user_id)
        .order_by(WorkoutPlan.created_at.desc())
        .limit(1)
    )
    latest_workout = workout_result.scalar_one_or_none()

    user_context = {
        "profile": user_to_profile(user),
        "recent_7_day_food_logs": [food_log_to_context(log) for log in recent_food],
        "recent_daily_logs": [daily_log_to_context(log) for log in recent_daily],
        "latest_workout_plan": parse_workout_plan(latest_workout.plan_json) if latest_workout else None,
    }
    used_context = {
        "has_profile": user is not None,
        "food_logs_count": len(recent_food),
        "daily_logs_count": len(recent_daily),
        "has_workout_plan": latest_workout is not None,
    }

    result = await ai_service.coach_chat(payload.message, user_context)
    return AgentChatResponse(
        reply=result["reply"],
        used_context=used_context,
    )


@router.post("/week-report", response_model=WeekReportResponse)
async def week_report(payload: WeekReportRequest, db: AsyncSession = Depends(get_db)):
    user_result = await db.execute(select(User).where(User.id == payload.user_id))
    user = user_result.scalar_one_or_none()

    week_start_date = date.today() - timedelta(days=6)
    week_start = datetime.combine(week_start_date, time.min)

    food_result = await db.execute(
        select(FoodLog)
        .where(FoodLog.user_id == payload.user_id)
        .where(
            or_(
                FoodLog.date >= week_start_date,
                and_(FoodLog.date.is_(None), FoodLog.created_at >= week_start),
            )
        )
        .order_by(FoodLog.created_at.desc())
    )
    recent_food = food_result.scalars().all()

    daily_result = await db.execute(
        select(DailyLog)
        .where(DailyLog.user_id == payload.user_id)
        .where(DailyLog.created_at >= week_start)
        .order_by(DailyLog.created_at.desc())
    )
    recent_daily = daily_result.scalars().all()

    workout_result = await db.execute(
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == payload.user_id)
        .order_by(WorkoutPlan.created_at.desc())
        .limit(1)
    )
    latest_workout = workout_result.scalar_one_or_none()

    return await ai_service.generate_week_report(
        user_profile=user_to_profile(user),
        food_logs=[food_log_to_context(log) for log in recent_food],
        daily_logs=[daily_log_to_context(log) for log in recent_daily],
        latest_workout_plan=parse_workout_plan(latest_workout.plan_json) if latest_workout else None,
    )


def user_to_profile(user: User | None) -> dict:
    if not user:
        return {}
    return {
        "height": user.height,
        "weight": user.weight,
        "age": user.age,
        "gender": user.gender,
        "goal": user.goal,
        "target_weight": user.target_weight,
        "training_level": user.training_level,
        "weekly_training_days": user.weekly_training_days,
        "diet_preference": user.diet_preference,
    }


def parse_workout_plan(plan_json: str) -> object:
    try:
        return json.loads(plan_json)
    except json.JSONDecodeError:
        return plan_json


def food_log_to_context(log: FoodLog) -> dict:
    return {
        "food_name": log.food_name,
        "estimated_weight": log.estimated_weight,
        "calories": log.calories,
        "protein": log.protein,
        "carbs": log.carbs,
        "fat": log.fat,
        "date": str(log.date) if log.date else None,
        "source": log.source,
    }


def daily_log_to_context(log: DailyLog) -> dict:
    return {
        "weight": log.weight,
        "mood": log.mood,
        "workout_done": log.workout_done,
        "sleep_hours": log.sleep_hours,
        "summary": log.summary,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }
