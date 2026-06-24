from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import WorkoutPlan, User
from app.schemas import WorkoutPlanRequest, WorkoutPlanResponse, WorkoutPlanRead
from app.services.ai_service import ai_service

router = APIRouter(prefix="/workout", tags=["workout"])


@router.post("/plan/mock", response_model=WorkoutPlanResponse)
async def generate_plan_mock(
    payload: WorkoutPlanRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalar_one_or_none()
    profile = {}
    if user:
        profile = {
            "goal": user.goal,
            "training_level": user.training_level,
            "weekly_training_days": user.weekly_training_days,
        }

    plan_days = await ai_service.mock_generate_workout_plan(profile)

    plan_record = WorkoutPlan(user_id=payload.user_id, plan_json=json.dumps(plan_days, ensure_ascii=False))
    db.add(plan_record)
    await db.commit()

    return WorkoutPlanResponse(
        user_id=payload.user_id,
        plan=plan_days,
        note="Phase 1 mock plan. AI will be connected in Phase 2.",
    )


@router.post("/plan", response_model=WorkoutPlanResponse)
async def generate_plan(
    payload: WorkoutPlanRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalar_one_or_none()
    profile = user_to_profile(user)

    plan_result = await ai_service.generate_workout_plan(profile)

    plan_record = WorkoutPlan(
        user_id=payload.user_id,
        plan_json=json.dumps(plan_result, ensure_ascii=False),
    )
    db.add(plan_record)
    await db.commit()

    return WorkoutPlanResponse(
        user_id=payload.user_id,
        plan=plan_result["plan"],
        summary=plan_result["summary"],
    )


@router.get("/plan/{user_id}", response_model=list[WorkoutPlanRead])
async def get_plans(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == user_id)
        .order_by(WorkoutPlan.created_at.desc())
    )
    return result.scalars().all()


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
