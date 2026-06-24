from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import MealPlanRequest, MealPlanResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/meal", tags=["meal"])


@router.post("/plan/mock", response_model=MealPlanResponse)
async def generate_meal_plan_mock(payload: MealPlanRequest):
    result = await ai_service.mock_generate_meal_plan(
        payload.ingredients,
        {"preference": payload.preference},
    )
    return MealPlanResponse(
        user_id=payload.user_id,
        meals=result["meals"],
        suggestion=result["suggestion"],
    )


@router.post("/plan", response_model=MealPlanResponse)
async def generate_meal_plan(payload: MealPlanRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalar_one_or_none()
    profile = user_to_profile(user)
    profile["preference"] = payload.preference

    meal_plan = await ai_service.generate_meal_plan(payload.ingredients, profile)
    return MealPlanResponse(
        user_id=payload.user_id,
        meals=meal_plan["meals"],
        suggestion=meal_plan["suggestion"],
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
