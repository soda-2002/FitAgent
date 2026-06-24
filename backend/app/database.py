from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    from app import models  # noqa: F401 — registers all models with Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await migrate_daily_logs(conn)


async def migrate_daily_logs(conn):
    """Add Phase 4 daily log columns for existing SQLite demo databases."""
    result = await conn.execute(text("PRAGMA table_info(daily_logs)"))
    existing_columns = {row[1] for row in result.fetchall()}

    migrations = {
        "weight": "ALTER TABLE daily_logs ADD COLUMN weight FLOAT",
        "mood": "ALTER TABLE daily_logs ADD COLUMN mood VARCHAR(50)",
        "workout_done": "ALTER TABLE daily_logs ADD COLUMN workout_done BOOLEAN",
        "sleep_hours": "ALTER TABLE daily_logs ADD COLUMN sleep_hours FLOAT",
    }
    for column, statement in migrations.items():
        if column not in existing_columns:
            await conn.execute(text(statement))
