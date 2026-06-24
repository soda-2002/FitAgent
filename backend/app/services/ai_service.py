"""
AI Service — Phase 1 stub.

All methods return mock data.
Phase 2 will wire call_text_model() to DashScope Qwen.
Phase 3 will wire call_vision_model() to DashScope Qwen-VL.

Model names are read from environment variables so they are never hard-coded:
  TEXT_MODEL   (default: qwen-plus)
  VISION_MODEL (default: qwen-vl-plus)
"""

from app.config import settings


class AIService:

    # ── Low-level model callers (Phase 2/3 will implement these) ──────────────

    async def call_text_model(self, prompt: str) -> str:
        """Call DashScope text model. Phase 2 implementation."""
        return f"[mock] text model ({settings.text_model}) response for: {prompt[:40]}"

    async def call_vision_model(self, prompt: str, image_url: str) -> str:
        """Call DashScope vision model. Phase 3 implementation."""
        return f"[mock] vision model ({settings.vision_model}) response"

    # ── High-level task methods ───────────────────────────────────────────────

    async def analyze_food_text(self, text: str) -> dict:
        """Analyze food description and return structured nutrition data."""
        return {
            "foods": [
                {
                    "name": "鸡蛋",
                    "estimated_weight": "100g",
                    "calories": 140,
                    "protein": 12,
                    "carbs": 1,
                    "fat": 10,
                },
                {
                    "name": "米饭",
                    "estimated_weight": "200g",
                    "calories": 260,
                    "protein": 5,
                    "carbs": 57,
                    "fat": 0.5,
                },
            ],
            "total_calories": 400,
            "suggestion": "Phase 1 mock result. AI will be connected in Phase 2.",
        }

    async def analyze_food_image(self, image_bytes: bytes) -> dict:
        """Analyze food image and return structured nutrition data."""
        return {
            "foods": [
                {
                    "name": "鸡胸肉饭",
                    "estimated_weight": "350g",
                    "calories": 520,
                    "protein": 38,
                    "carbs": 55,
                    "fat": 12,
                }
            ],
            "total_calories": 520,
            "confidence": "mock",
            "suggestion": "Phase 1 mock image analysis. Qwen-VL will be connected in Phase 3.",
        }

    async def generate_meal_plan(self, ingredients: str, user_profile: dict) -> dict:
        """Generate meal plan from available ingredients."""
        preference = user_profile.get("preference") or "高蛋白、低脂"
        return {
            "meals": [
                {
                    "name": "番茄鸡胸肉炒蛋",
                    "calories": 420,
                    "protein": 38,
                    "difficulty": "easy",
                    "steps": [
                        "鸡胸肉切丁并简单腌制",
                        "番茄切块，鸡蛋打散",
                        "先炒鸡胸肉至变色，再加入番茄",
                        "倒入鸡蛋翻炒至凝固后出锅",
                    ],
                    "reason": f"{preference}，适合减脂期晚餐。可用食材：{ingredients}",
                }
            ],
            "suggestion": "Phase 1.5 mock result. Qwen will be connected later.",
        }

    async def generate_workout_plan(self, user_profile: dict) -> list[dict]:
        """Generate 7-day workout plan based on user profile."""
        return [
            {"day": "Monday", "focus": "胸 + 三头", "exercises": [
                {"name": "俯卧撑", "sets": 4, "reps": 12},
                {"name": "窄距俯卧撑", "sets": 3, "reps": 10},
            ]},
            {"day": "Tuesday", "focus": "背 + 二头", "exercises": [
                {"name": "引体向上", "sets": 4, "reps": 8},
                {"name": "哑铃弯举", "sets": 3, "reps": 12},
            ]},
            {"day": "Wednesday", "focus": "休息 / 有氧", "exercises": [
                {"name": "慢跑 30 分钟", "sets": 1, "reps": 1},
            ]},
            {"day": "Thursday", "focus": "腿", "exercises": [
                {"name": "深蹲", "sets": 4, "reps": 15},
                {"name": "弓步蹲", "sets": 3, "reps": 12},
            ]},
            {"day": "Friday", "focus": "肩 + 核心", "exercises": [
                {"name": "肩推", "sets": 4, "reps": 10},
                {"name": "平板支撑", "sets": 3, "reps": 60},
            ]},
            {"day": "Saturday", "focus": "全身 HIIT", "exercises": [
                {"name": "波比跳", "sets": 4, "reps": 10},
                {"name": "开合跳", "sets": 3, "reps": 30},
            ]},
            {"day": "Sunday", "focus": "主动休息", "exercises": [
                {"name": "拉伸 20 分钟", "sets": 1, "reps": 1},
            ]},
        ]

    async def coach_chat(self, message: str, user_context: dict) -> str:
        """AI Coach chat response based on user history."""
        return (
            f"[Phase 1 mock] 你问的是：「{message}」。"
            "我已经了解你的健身目标和饮食记录。"
            "Phase 4 接入 Qwen 后，我会根据你的真实数据给出个性化建议。"
        )


ai_service = AIService()
