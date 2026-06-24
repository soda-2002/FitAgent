from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import DailyLog
from app.schemas import DailyLogCreate, DailyLogRead

router = APIRouter(prefix="/daily", tags=["daily"])


@router.post("/logs", response_model=DailyLogRead)
async def save_daily_log(payload: DailyLogCreate, db: AsyncSession = Depends(get_db)):
    log = DailyLog(**payload.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/logs/{user_id}", response_model=list[DailyLogRead])
async def get_daily_logs(
    user_id: int,
    limit: int = 7,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DailyLog)
        .where(DailyLog.user_id == user_id)
        .order_by(DailyLog.created_at.desc())
        .limit(max(1, min(limit, 30)))
    )
    return result.scalars().all()
