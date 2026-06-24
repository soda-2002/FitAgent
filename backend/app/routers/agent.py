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

    reply = await ai_service.coach_chat(payload.message, user_context)
    return AgentChatResponse(
        reply=reply,
        note="Phase 1 mock. Agent tool-calling will be implemented in Phase 4.",
    )
