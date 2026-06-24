from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import Integer, String, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    height: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    goal: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    target_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    training_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    weekly_training_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    diet_preference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    food_logs: Mapped[List["FoodLog"]] = relationship("FoodLog", back_populates="user")
    workout_plans: Mapped[List["WorkoutPlan"]] = relationship("WorkoutPlan", back_populates="user")
    daily_logs: Mapped[List["DailyLog"]] = relationship("DailyLog", back_populates="user")


class FoodLog(Base):
    __tablename__ = "food_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    food_name: Mapped[str] = mapped_column(String(200), nullable=False)
    estimated_weight: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    calories: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    protein: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    carbs: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="food_logs")


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    plan_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="workout_plans")


class DailyLog(Base):
    __tablename__ = "daily_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="daily_logs")
