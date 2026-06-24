from __future__ import annotations

from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import DailyLog, FoodLog, User, WorkoutPlan
from app.schemas import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/{user_id}", response_model=DashboardResponse)
async def get_dashboard(user_id: int, db: AsyncSession = Depends(get_db)):
    today = date.today()
    today_start = datetime.combine(today, time.min)
    week_start_date = today - timedelta(days=6)
    week_start = datetime.combine(week_start_date, time.min)

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    today_food_result = await db.execute(
        select(FoodLog)
        .where(FoodLog.user_id == user_id)
        .where(
            or_(
                FoodLog.date == today,
                and_(FoodLog.date.is_(None), FoodLog.created_at >= today_start),
            )
        )
    )
    today_food_logs = today_food_result.scalars().all()

    week_food_result = await db.execute(
        select(FoodLog)
        .where(FoodLog.user_id == user_id)
        .where(
            or_(
                FoodLog.date >= week_start_date,
                and_(FoodLog.date.is_(None), FoodLog.created_at >= week_start),
            )
        )
    )
    week_food_logs = week_food_result.scalars().all()

    daily_result = await db.execute(
        select(DailyLog)
        .where(DailyLog.user_id == user_id)
        .where(DailyLog.created_at >= week_start)
        .order_by(DailyLog.created_at.desc())
    )
    daily_logs = daily_result.scalars().all()

    workout_result = await db.execute(
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == user_id)
        .order_by(WorkoutPlan.created_at.desc())
        .limit(1)
    )
    latest_workout = workout_result.scalar_one_or_none()

    today_totals = nutrition_totals(today_food_logs)
    week_totals = nutrition_totals(week_food_logs)

    return {
        "profile": user_to_dashboard_profile(user) if user else None,
        "today": {
            **today_totals,
            "food_logs_count": len(today_food_logs),
        },
        "week": {
            "avg_calories": round(week_totals["total_calories"] / 7, 1),
            "avg_protein": round(week_totals["total_protein"] / 7, 1),
            "food_logs_count": len(week_food_logs),
            "workout_plan_exists": latest_workout is not None,
            "daily_logs_count": len(daily_logs),
        },
        "suggestion": build_dashboard_suggestion(
            has_profile=user is not None,
            today_logs_count=len(today_food_logs),
            week_logs_count=len(week_food_logs),
            today_calories=today_totals["total_calories"],
            today_protein=today_totals["total_protein"],
            has_workout_plan=latest_workout is not None,
        ),
    }


def nutrition_totals(food_logs: list[FoodLog]) -> dict[str, float]:
    return {
        "total_calories": round(sum(float(log.calories or 0) for log in food_logs), 1),
        "total_protein": round(sum(float(log.protein or 0) for log in food_logs), 1),
        "total_carbs": round(sum(float(log.carbs or 0) for log in food_logs), 1),
        "total_fat": round(sum(float(log.fat or 0) for log in food_logs), 1),
    }


def user_to_dashboard_profile(user: User) -> dict:
    return {
        "height": user.height,
        "weight": user.weight,
        "target_weight": user.target_weight,
        "goal": user.goal,
    }


def build_dashboard_suggestion(
    has_profile: bool,
    today_logs_count: int,
    week_logs_count: int,
    today_calories: float,
    today_protein: float,
    has_workout_plan: bool,
) -> str:
    if not has_profile:
        return "请先完成 Profile 建档，FitAgent 才能结合你的目标给出建议。"
    if week_logs_count == 0:
        return "最近 7 天还没有饮食记录，先去 Food 页面记录一餐，Dashboard 会自动更新。"
    if today_logs_count == 0:
        return "今天还没有饮食记录，建议至少记录一餐，方便观察热量和蛋白质摄入。"
    if today_protein < 50:
        return "今天蛋白质记录偏少，下一餐可以优先补充鸡蛋、鱼虾、鸡胸肉或豆制品。"
    if today_calories > 2200:
        return "今天记录热量偏高，晚餐建议减少油脂和精制碳水，增加蔬菜比例。"
    if not has_workout_plan:
        return "饮食记录已经开始积累，建议再生成一份本周训练计划，形成饮食加运动闭环。"
    return "今天记录状态较稳定，继续保持饮食记录和训练执行，避免极端节食。"
