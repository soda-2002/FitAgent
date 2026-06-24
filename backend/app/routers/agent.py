from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, FoodLog, WorkoutPlan
from app.schemas import AgentChatRequest, AgentChatResponse
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

    food_result = await db.execute(
        select(FoodLog)
        .where(FoodLog.user_id == payload.user_id)
        .order_by(FoodLog.created_at.desc())
        .limit(5)
    )
    recent_food = food_result.scalars().all()

    workout_result = await db.execute(
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == payload.user_id)
        .order_by(WorkoutPlan.created_at.desc())
        .limit(1)
    )
    latest_workout = workout_result.scalar_one_or_none()

    user_context = {
        "profile": user_to_profile(user),
        "recent_food_logs": [
            {
                "food_name": log.food_name,
                "calories": log.calories,
                "protein": log.protein,
                "carbs": log.carbs,
                "fat": log.fat,
                "date": str(log.date) if log.date else None,
            }
            for log in recent_food
        ],
        "latest_workout_plan": parse_workout_plan(latest_workout.plan_json) if latest_workout else None,
    }
    used_context = {
        "has_profile": user is not None,
        "food_logs_count": len(recent_food),
        "has_workout_plan": latest_workout is not None,
    }

    result = await ai_service.coach_chat(payload.message, user_context)
    return AgentChatResponse(
        reply=result["reply"],
        used_context=used_context,
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
