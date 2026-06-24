from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import FoodLog, User
from app.schemas import (
    FoodTextAnalyzeRequest,
    FoodAnalyzeResponse,
    FoodLogCreate,
    FoodLogRead,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/food", tags=["food"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


@router.post("/text-analyze/mock", response_model=FoodAnalyzeResponse)
async def text_analyze_mock(payload: FoodTextAnalyzeRequest):
    result = await ai_service.mock_analyze_food_text(payload.text)
    return result


@router.post("/text-analyze", response_model=FoodAnalyzeResponse)
async def text_analyze(payload: FoodTextAnalyzeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalar_one_or_none()
    profile = user_to_profile(user)

    result = await ai_service.analyze_food_text(payload.text, profile)
    return result


@router.post("/image-analyze/mock", response_model=FoodAnalyzeResponse)
async def image_analyze_mock(
    user_id: int = Form(...),
    image: UploadFile = File(...),
):
    image_bytes = await image.read()
    result = await ai_service.mock_analyze_food_image(image_bytes)
    return result


@router.post("/image-analyze", response_model=FoodAnalyzeResponse)
async def image_analyze(
    user_id: int = Form(...),
    image: UploadFile = File(...),
):
    content_type = image.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Please upload jpg, jpeg, png, or webp.",
        )

    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Please upload an image smaller than 5MB.",
        )

    result = await ai_service.analyze_food_image(image_bytes, content_type)
    return result


@router.post("/logs", response_model=FoodLogRead)
async def save_food_log(payload: FoodLogCreate, db: AsyncSession = Depends(get_db)):
    log = FoodLog(**payload.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/logs/{user_id}", response_model=list[FoodLogRead])
async def get_food_logs(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FoodLog).where(FoodLog.user_id == user_id).order_by(FoodLog.created_at.desc())
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
