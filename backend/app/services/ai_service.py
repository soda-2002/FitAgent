"""
AI Service.

Phase 2 wires text tasks to DashScope Qwen through the OpenAI-compatible
Chat Completions endpoint. Vision remains mock-only until Phase 3.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import re
import urllib.error
import urllib.request
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)

DASHSCOPE_CHAT_COMPLETIONS_URL = (
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
)


class AIService:
    # ── Low-level model callers ───────────────────────────────────────────────

    async def call_text_model(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> Optional[str]:
        """Call DashScope text model. Returns None when unavailable."""
        if not settings.dashscope_api_key:
            logger.warning(
                "DASHSCOPE_API_KEY is not set; using fallback for TEXT_MODEL=%s",
                settings.text_model,
            )
            return None

        payload = {
            "model": settings.text_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }

        try:
            return await asyncio.to_thread(self._post_text_model_sync, payload)
        except Exception as exc:  # noqa: BLE001 - never let model failures crash API
            logger.exception(
                "DashScope text model call failed for TEXT_MODEL=%s: %s",
                settings.text_model,
                exc,
            )
            return None

    def _post_text_model_sync(self, payload: dict[str, Any]) -> str:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            DASHSCOPE_CHAT_COMPLETIONS_URL,
            data=body,
            headers={
                "Authorization": f"Bearer {settings.dashscope_api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:800]
            raise RuntimeError(
                f"DashScope HTTP {exc.code} for TEXT_MODEL={settings.text_model}: {detail}"
            ) from exc

        data = json.loads(raw)
        return data["choices"][0]["message"]["content"]

    async def call_vision_model(
        self,
        system_prompt: str,
        user_prompt: str,
        image_data_url: str,
        temperature: float = 0.1,
    ) -> Optional[str]:
        """Call DashScope vision model. Returns None when unavailable."""
        if not settings.dashscope_api_key:
            logger.warning(
                "DASHSCOPE_API_KEY is not set; using fallback for VISION_MODEL=%s",
                settings.vision_model,
            )
            return None

        payload = {
            "model": settings.vision_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ],
                },
            ],
            "temperature": temperature,
        }

        try:
            return await asyncio.to_thread(self._post_vision_model_sync, payload)
        except Exception as exc:  # noqa: BLE001 - never let model failures crash API
            logger.exception(
                "DashScope vision model call failed for VISION_MODEL=%s: %s",
                settings.vision_model,
                exc,
            )
            return None

    def _post_vision_model_sync(self, payload: dict[str, Any]) -> str:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            DASHSCOPE_CHAT_COMPLETIONS_URL,
            data=body,
            headers={
                "Authorization": f"Bearer {settings.dashscope_api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:800]
            raise RuntimeError(
                f"DashScope HTTP {exc.code} for VISION_MODEL={settings.vision_model}: {detail}"
            ) from exc

        data = json.loads(raw)
        return data["choices"][0]["message"]["content"]

    def image_bytes_to_data_url(self, image_bytes: bytes, content_type: str) -> str:
        encoded = base64.b64encode(image_bytes).decode("ascii")
        return f"data:{content_type};base64,{encoded}"

    # ── JSON parsing helpers ─────────────────────────────────────────────────

    def extract_json_object(self, raw: str) -> dict[str, Any]:
        cleaned = raw.strip()
        fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.S | re.I)
        if fence_match:
            cleaned = fence_match.group(1).strip()

        try:
            data = json.loads(cleaned)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass

        candidate = self._find_first_json_object(cleaned)
        if candidate is None:
            raise ValueError("No JSON object found in model output")

        data = json.loads(candidate)
        if not isinstance(data, dict):
            raise ValueError("Model output JSON is not an object")
        return data

    def _find_first_json_object(self, text: str) -> Optional[str]:
        start = text.find("{")
        if start < 0:
            return None

        depth = 0
        in_string = False
        escaped = False
        for index in range(start, len(text)):
            char = text[index]
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
                continue

            if char == '"':
                in_string = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return text[start : index + 1]
        return None

    def _as_float(self, value: Any, default: float = 0.0) -> float:
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            match = re.search(r"-?\d+(?:\.\d+)?", value)
            if match:
                return float(match.group(0))
        return default

    def _normalize_estimated_weight(self, value: Any) -> str:
        if value is None or value == "":
            return "unknown"
        if isinstance(value, (int, float)):
            return f"{value:g}g"
        text = str(value).strip()
        return text or "unknown"

    def _as_int(self, value: Any, default: int = 1) -> int:
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return default

    # ── Mock methods retained for /mock routes ────────────────────────────────

    async def mock_analyze_food_text(self, text: str) -> dict[str, Any]:
        return self._fallback_food_analysis("Phase 1 mock result. AI will be connected in Phase 2.")

    async def mock_analyze_food_image(self, image_bytes: bytes) -> dict[str, Any]:
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

    async def mock_generate_meal_plan(
        self,
        ingredients: str,
        user_profile: dict[str, Any],
    ) -> dict[str, Any]:
        preference = user_profile.get("preference") or "高蛋白、低脂"
        return self._fallback_meal_plan(
            ingredients,
            preference,
            "Phase 1.5 mock result. Qwen will be connected later.",
        )

    async def mock_generate_workout_plan(self, user_profile: dict[str, Any]) -> list[dict[str, Any]]:
        return self._fallback_workout_plan()["plan"]

    async def mock_coach_chat(self, message: str, user_context: dict[str, Any]) -> str:
        return (
            f"[Phase 1 mock] 你问的是：「{message}」。"
            "我已经了解你的健身目标和饮食记录。"
            "Phase 4 接入 Qwen 后，我会根据你的真实数据给出个性化建议。"
        )

    # ── Real text task methods with structured fallback ───────────────────────

    async def analyze_food_text(
        self,
        text: str,
        user_profile: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        system_prompt = (
            "你是 FitAgent 的饮食估算助手。你提供的是非医疗建议，只能做营养估算，"
            "不要声称绝对准确。只输出 JSON 对象，不要输出 Markdown。"
        )
        user_prompt = json.dumps(
            {
                "task": "根据用户饮食文本估算食物重量、热量和三大营养素。",
                "required_json_schema": {
                    "foods": [
                        {
                            "name": "食物名",
                            "estimated_weight": "估算重量字符串，例如 100g",
                            "calories": 0,
                            "protein": 0,
                            "carbs": 0,
                            "fat": 0,
                        }
                    ],
                    "total_calories": 0,
                    "suggestion": "中文建议，说明这是估算",
                },
                "user_profile": user_profile or {},
                "food_text": text,
            },
            ensure_ascii=False,
        )
        raw = await self.call_text_model(system_prompt, user_prompt)
        if not raw:
            return self._fallback_food_analysis(
                "当前未能调用 Qwen 文本模型，以下为 fallback 估算结果，仅供参考。"
            )

        try:
            return self._normalize_food_analysis(self.extract_json_object(raw))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to parse food analysis JSON: %s", exc)
            return self._fallback_food_analysis(
                "Qwen 输出格式不稳定，已返回 fallback 估算结果，仅供参考。"
            )

    async def analyze_food_image(self, image_bytes: bytes, content_type: str) -> dict[str, Any]:
        system_prompt = (
            "你是一个减脂饮食分析助手。请根据图片识别其中可能的食物，并估算每种食物的"
            "大致重量、热量、蛋白质、碳水、脂肪。图片热量识别是估算，不是绝对准确。"
            "如果无法识别或图片不是食物，返回空 foods 和低置信度。只输出 JSON 对象，不要输出 Markdown。"
        )
        user_prompt = json.dumps(
            {
                "task": "识别图片中的食物并估算营养。",
                "required_json_schema": {
                    "foods": [
                        {
                            "name": "食物名称",
                            "estimated_weight": "估算重量",
                            "calories": 0,
                            "protein": 0,
                            "carbs": 0,
                            "fat": 0,
                        }
                    ],
                    "total_calories": 0,
                    "confidence": "medium",
                    "suggestion": "这只是基于图片的粗略估算，建议手动确认份量。",
                },
            },
            ensure_ascii=False,
        )
        image_data_url = self.image_bytes_to_data_url(image_bytes, content_type)
        raw = await self.call_vision_model(system_prompt, user_prompt, image_data_url)
        if not raw:
            return self._fallback_image_analysis(
                "当前未能调用 Qwen-VL 图片识别，以下为 fallback 估算结果。图片热量识别仅为估算，请确认份量后保存。"
            )

        try:
            return self._normalize_image_analysis(self.extract_json_object(raw))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to parse image analysis JSON: %s", exc)
            return self._fallback_image_analysis(
                "Qwen-VL 输出格式不稳定，已返回 fallback 估算结果。图片热量识别仅为估算，请确认份量后保存。"
            )

    async def generate_meal_plan(
        self,
        ingredients: str,
        user_profile: dict[str, Any],
    ) -> dict[str, Any]:
        preference = user_profile.get("preference") or "高蛋白、低脂"
        system_prompt = (
            "你是 FitAgent 的减脂餐推荐助手。优先高蛋白、低油、简单易做。"
            "你提供的是非医疗建议。只输出 JSON 对象，不要输出 Markdown。"
        )
        user_prompt = json.dumps(
            {
                "task": "根据现有食材推荐 1-3 个减脂餐方案。",
                "required_json_schema": {
                    "meals": [
                        {
                            "name": "菜名",
                            "calories": 0,
                            "protein": 0,
                            "difficulty": "easy",
                            "steps": ["步骤1", "步骤2"],
                            "reason": "推荐原因",
                        }
                    ],
                    "suggestion": "中文搭配建议",
                },
                "ingredients": ingredients,
                "preference": preference,
                "user_profile": user_profile,
            },
            ensure_ascii=False,
        )
        raw = await self.call_text_model(system_prompt, user_prompt)
        if not raw:
            return self._fallback_meal_plan(
                ingredients,
                preference,
                "当前未能调用 Qwen 文本模型，以下为 fallback 减脂餐建议。",
            )

        try:
            return self._normalize_meal_plan(self.extract_json_object(raw), ingredients, preference)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to parse meal plan JSON: %s", exc)
            return self._fallback_meal_plan(
                ingredients,
                preference,
                "Qwen 输出格式不稳定，已返回 fallback 减脂餐建议。",
            )

    async def generate_workout_plan(self, user_profile: dict[str, Any]) -> dict[str, Any]:
        system_prompt = (
            "你是 FitAgent 的健身计划助手。根据用户基础信息生成保守、安全的一周计划。"
            "不提供危险动作，不做医疗诊断；初学者强度要保守。只输出 JSON 对象。"
        )
        user_prompt = json.dumps(
            {
                "task": "生成一周训练计划。",
                "required_json_schema": {
                    "plan": [
                        {
                            "day": "Monday",
                            "focus": "训练重点",
                            "duration": "45分钟",
                            "exercises": [
                                {
                                    "name": "动作名",
                                    "sets": 3,
                                    "reps": "10-12",
                                    "note": "注意事项",
                                }
                            ],
                        }
                    ],
                    "summary": "中文总结",
                },
                "user_profile": user_profile,
            },
            ensure_ascii=False,
        )
        raw = await self.call_text_model(system_prompt, user_prompt)
        if not raw:
            return self._fallback_workout_plan(
                "当前未能调用 Qwen 文本模型，以下为 fallback 一周训练计划。"
            )

        try:
            return self._normalize_workout_plan(self.extract_json_object(raw))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to parse workout plan JSON: %s", exc)
            return self._fallback_workout_plan(
                "Qwen 输出格式不稳定，已返回 fallback 一周训练计划。"
            )

    async def coach_chat(self, message: str, user_context: dict[str, Any]) -> dict[str, Any]:
        system_prompt = (
            "你是 FitAgent 的 AI 减脂教练。根据用户资料、饮食记录和训练计划给出可执行建议。"
            "不要做医疗诊断，不要建议极端节食；用中文回答。只输出 JSON 对象。"
        )
        user_prompt = json.dumps(
            {
                "task": "回答用户的健康管理问题。",
                "required_json_schema": {
                    "reply": "中文回答",
                },
                "message": message,
                "user_context": user_context,
            },
            ensure_ascii=False,
        )
        raw = await self.call_text_model(system_prompt, user_prompt, temperature=0.4)
        if not raw:
            return {
                "reply": "当前未能调用 Qwen 文本模型。建议先保持正常饮食节奏，避免极端节食，优先保证蛋白质、蔬菜和适量运动。",
            }

        try:
            data = self.extract_json_object(raw)
            reply = str(data.get("reply") or "").strip()
            if reply:
                return {"reply": reply}
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to parse coach chat JSON: %s", exc)

        return {
            "reply": "Qwen 输出格式不稳定。建议今天先记录饮食和训练情况，下一餐减少油脂和精制碳水，保持正常作息。",
        }

    # ── Normalizers and fallback payloads ─────────────────────────────────────

    def _normalize_food_analysis(self, data: dict[str, Any]) -> dict[str, Any]:
        foods = []
        for item in data.get("foods") or []:
            if not isinstance(item, dict):
                continue
            foods.append(self._normalize_food_item(item))

        if not foods:
            return self._fallback_food_analysis("未能解析食物明细，已返回 fallback 估算。")

        total_calories = self._as_float(
            data.get("total_calories"),
            sum(food["calories"] for food in foods),
        )
        return {
            "foods": foods,
            "total_calories": total_calories,
            "suggestion": str(data.get("suggestion") or "以上为估算值，建议结合实际份量调整。"),
        }

    def _normalize_image_analysis(self, data: dict[str, Any]) -> dict[str, Any]:
        foods = []
        for item in data.get("foods") or []:
            if not isinstance(item, dict):
                continue
            foods.append(self._normalize_food_item(item))

        confidence = str(data.get("confidence") or "medium").lower()
        if confidence not in {"high", "medium", "low", "fallback"}:
            confidence = "medium"

        total_calories = self._as_float(
            data.get("total_calories"),
            sum(food["calories"] for food in foods),
        )
        if not foods:
            confidence = "low"
            total_calories = 0

        suggestion = str(
            data.get("suggestion")
            or "图片识别结果仅为估算。建议手动确认份量后再保存。"
        )
        if "估算" not in suggestion:
            suggestion += " 图片识别热量仅为估算，请确认份量后保存。"

        return {
            "foods": foods,
            "total_calories": total_calories,
            "confidence": confidence,
            "suggestion": suggestion,
        }

    def _normalize_food_item(self, item: dict[str, Any]) -> dict[str, Any]:
        return {
            "name": str(item.get("name") or "未识别食物"),
            "estimated_weight": self._normalize_estimated_weight(
                item.get("estimated_weight") if item.get("estimated_weight") is not None else item.get("weight")
            ),
            "calories": self._as_float(item.get("calories")),
            "protein": self._as_float(item.get("protein")),
            "carbs": self._as_float(item.get("carbs")),
            "fat": self._as_float(item.get("fat")),
        }

    def _normalize_meal_plan(
        self,
        data: dict[str, Any],
        ingredients: str,
        preference: str,
    ) -> dict[str, Any]:
        meals = []
        for item in data.get("meals") or data.get("plans") or []:
            if not isinstance(item, dict):
                continue
            steps = item.get("steps") if isinstance(item.get("steps"), list) else []
            meals.append(
                {
                    "name": str(item.get("name") or "减脂餐"),
                    "calories": self._as_float(item.get("calories"), 420),
                    "protein": self._as_float(item.get("protein"), 30),
                    "difficulty": str(item.get("difficulty") or "easy"),
                    "steps": [str(step) for step in steps] or ["少油烹饪", "控制主食份量", "搭配蔬菜"],
                    "reason": str(item.get("reason") or f"{preference}，适合减脂期。可用食材：{ingredients}"),
                }
            )
        if not meals:
            return self._fallback_meal_plan(ingredients, preference, "未能解析餐单，已返回 fallback 建议。")

        return {
            "meals": meals,
            "suggestion": str(data.get("suggestion") or "建议搭配一份绿叶菜，提高饱腹感。"),
        }

    def _normalize_workout_plan(self, data: dict[str, Any]) -> dict[str, Any]:
        plan = []
        for item in data.get("plan") or []:
            if not isinstance(item, dict):
                continue
            exercises = []
            for exercise in item.get("exercises") or []:
                if not isinstance(exercise, dict):
                    continue
                exercises.append(
                    {
                        "name": str(exercise.get("name") or "训练动作"),
                        "sets": self._as_int(exercise.get("sets"), 3),
                        "reps": str(exercise.get("reps") or "10-12"),
                        "note": str(exercise.get("note") or "保持动作稳定，不适时停止。"),
                    }
                )
            plan.append(
                {
                    "day": str(item.get("day") or "Day"),
                    "focus": str(item.get("focus") or "综合训练"),
                    "duration": str(item.get("duration") or "30-45分钟"),
                    "exercises": exercises
                    or [{"name": "快走", "sets": 1, "reps": "30分钟", "note": "中低强度。"}],
                }
            )
        if not plan:
            return self._fallback_workout_plan("未能解析训练计划，已返回 fallback 计划。")

        return {
            "plan": plan,
            "summary": str(data.get("summary") or "本计划为估算建议，请根据身体状态调整强度。"),
        }

    def _fallback_food_analysis(self, suggestion: str) -> dict[str, Any]:
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
            "suggestion": suggestion,
        }

    def _fallback_image_analysis(self, suggestion: str) -> dict[str, Any]:
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
            "confidence": "fallback",
            "suggestion": suggestion,
        }

    def _fallback_meal_plan(
        self,
        ingredients: str,
        preference: str,
        suggestion: str,
    ) -> dict[str, Any]:
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
            "suggestion": suggestion,
        }

    def _fallback_workout_plan(self, summary: str = "Phase 1 mock plan. AI will be connected in Phase 2.") -> dict[str, Any]:
        return {
            "plan": [
                {
                    "day": "Monday",
                    "focus": "上肢力量",
                    "duration": "35分钟",
                    "exercises": [
                        {"name": "俯卧撑", "sets": 3, "reps": "8-12", "note": "保持核心收紧。"},
                        {"name": "弹力带划船", "sets": 3, "reps": "12", "note": "肩部放松。"},
                    ],
                },
                {
                    "day": "Tuesday",
                    "focus": "低强度有氧",
                    "duration": "30分钟",
                    "exercises": [
                        {"name": "快走", "sets": 1, "reps": "30分钟", "note": "保持可对话强度。"},
                    ],
                },
                {
                    "day": "Wednesday",
                    "focus": "下肢力量",
                    "duration": "35分钟",
                    "exercises": [
                        {"name": "徒手深蹲", "sets": 3, "reps": "12", "note": "膝盖方向与脚尖一致。"},
                        {"name": "臀桥", "sets": 3, "reps": "12", "note": "顶峰收紧臀部。"},
                    ],
                },
                {
                    "day": "Thursday",
                    "focus": "主动恢复",
                    "duration": "20分钟",
                    "exercises": [
                        {"name": "拉伸", "sets": 1, "reps": "20分钟", "note": "避免疼痛区间。"},
                    ],
                },
                {
                    "day": "Friday",
                    "focus": "全身循环",
                    "duration": "30分钟",
                    "exercises": [
                        {"name": "开合跳", "sets": 3, "reps": "30秒", "note": "不适可改原地踏步。"},
                        {"name": "平板支撑", "sets": 3, "reps": "20-30秒", "note": "腰背保持平直。"},
                    ],
                },
                {
                    "day": "Saturday",
                    "focus": "轻有氧",
                    "duration": "30分钟",
                    "exercises": [
                        {"name": "骑行或快走", "sets": 1, "reps": "30分钟", "note": "中低强度。"},
                    ],
                },
                {
                    "day": "Sunday",
                    "focus": "休息",
                    "duration": "10分钟",
                    "exercises": [
                        {"name": "轻松拉伸", "sets": 1, "reps": "10分钟", "note": "恢复为主。"},
                    ],
                },
            ],
            "summary": summary,
        }


ai_service = AIService()
