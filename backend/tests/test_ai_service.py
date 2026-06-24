import asyncio
import unittest

from app.config import settings
from app.services.ai_service import AIService


class AIServicePhase2Test(unittest.TestCase):
    def test_extract_json_object_from_markdown_fence(self):
        raw = """
        ```json
        {"foods":[{"name":"鸡蛋","calories":140}],"total_calories":140}
        ```
        """

        parsed = AIService().extract_json_object(raw)

        self.assertEqual(parsed["foods"][0]["name"], "鸡蛋")
        self.assertEqual(parsed["total_calories"], 140)

    def test_call_text_model_returns_none_without_api_key(self):
        original_key = settings.dashscope_api_key
        settings.dashscope_api_key = ""
        try:
            result = asyncio.run(
                AIService().call_text_model(
                    system_prompt="只输出 JSON",
                    user_prompt="测试",
                )
            )
        finally:
            settings.dashscope_api_key = original_key

        self.assertIsNone(result)

    def test_image_bytes_to_data_url(self):
        data_url = AIService().image_bytes_to_data_url(b"abc", "image/png")

        self.assertEqual(data_url, "data:image/png;base64,YWJj")

    def test_call_vision_model_returns_none_without_api_key(self):
        original_key = settings.dashscope_api_key
        settings.dashscope_api_key = ""
        try:
            result = asyncio.run(
                AIService().call_vision_model(
                    system_prompt="只输出 JSON",
                    user_prompt="识别食物",
                    image_data_url="data:image/png;base64,YWJj",
                )
            )
        finally:
            settings.dashscope_api_key = original_key

        self.assertIsNone(result)

    def test_image_analysis_converts_numeric_estimated_weight_to_string(self):
        result = AIService()._normalize_image_analysis(
            {
                "foods": [
                    {
                        "name": "米饭",
                        "estimated_weight": 250,
                        "calories": "320 kcal",
                        "protein": "6",
                        "carbs": "70g",
                        "fat": None,
                    }
                ],
                "total_calories": "320 kcal",
            }
        )

        food = result["foods"][0]
        self.assertEqual(food["estimated_weight"], "250g")
        self.assertEqual(food["calories"], 320.0)
        self.assertEqual(food["protein"], 6.0)
        self.assertEqual(food["carbs"], 70.0)
        self.assertEqual(food["fat"], 0.0)
        self.assertEqual(result["total_calories"], 320.0)
        self.assertEqual(result["confidence"], "medium")

    def test_food_analysis_converts_missing_estimated_weight_to_unknown(self):
        result = AIService()._normalize_food_analysis(
            {
                "foods": [
                    {
                        "name": "鸡蛋",
                        "estimated_weight": None,
                        "calories": 140,
                        "protein": 12,
                        "carbs": 1,
                        "fat": 10,
                    }
                ]
            }
        )

        self.assertEqual(result["foods"][0]["estimated_weight"], "unknown")

    def test_week_report_normalizes_missing_list_fields(self):
        result = AIService()._normalize_week_report(
            {
                "summary": "本周记录较少。",
                "diet_review": "饮食记录不足。",
                "workout_review": "",
                "problems": "晚餐油脂偏高",
                "next_week_plan": None,
            },
            food_logs_count=2,
            daily_logs_count=1,
            has_workout_plan=False,
        )

        report = result["report"]
        self.assertEqual(report["summary"], "本周记录较少。")
        self.assertEqual(report["diet_review"], "饮食记录不足。")
        self.assertIn("训练计划", report["workout_review"])
        self.assertEqual(report["problems"], ["晚餐油脂偏高"])
        self.assertGreaterEqual(len(report["next_week_plan"]), 1)
        self.assertEqual(result["used_context"]["food_logs_count"], 2)
        self.assertEqual(result["used_context"]["daily_logs_count"], 1)
        self.assertFalse(result["used_context"]["has_workout_plan"])

    def test_generate_week_report_returns_fallback_without_api_key(self):
        original_key = settings.dashscope_api_key
        settings.dashscope_api_key = ""
        try:
            result = asyncio.run(
                AIService().generate_week_report(
                    user_profile={},
                    food_logs=[],
                    daily_logs=[],
                    latest_workout_plan=None,
                )
            )
        finally:
            settings.dashscope_api_key = original_key

        self.assertIn("report", result)
        self.assertIn("used_context", result)
        self.assertIn("记录不足", result["report"]["summary"])
        self.assertEqual(result["used_context"]["food_logs_count"], 0)
        self.assertEqual(result["used_context"]["daily_logs_count"], 0)
        self.assertFalse(result["used_context"]["has_workout_plan"])


if __name__ == "__main__":
    unittest.main()
