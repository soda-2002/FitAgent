from fastapi import APIRouter

from app.schemas import MealPlanRequest, MealPlanResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/meal", tags=["meal"])


@router.post("/plan/mock", response_model=MealPlanResponse)
async def generate_meal_plan_mock(payload: MealPlanRequest):
    result = await ai_service.generate_meal_plan(
        payload.ingredients,
        {"preference": payload.preference},
    )
    return MealPlanResponse(
        user_id=payload.user_id,
        meals=result["meals"],
        suggestion=result["suggestion"],
    )
