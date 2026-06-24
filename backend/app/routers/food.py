from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import FoodLog
from app.schemas import (
    FoodTextAnalyzeRequest,
    FoodAnalyzeResponse,
    FoodLogCreate,
    FoodLogRead,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/food", tags=["food"])


@router.post("/text-analyze/mock", response_model=FoodAnalyzeResponse)
async def text_analyze_mock(payload: FoodTextAnalyzeRequest):
    result = await ai_service.analyze_food_text(payload.text)
    return result


@router.post("/image-analyze/mock", response_model=FoodAnalyzeResponse)
async def image_analyze_mock(
    user_id: int = Form(...),
    image: UploadFile = File(...),
):
    image_bytes = await image.read()
    result = await ai_service.analyze_food_image(image_bytes)
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
