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


if __name__ == "__main__":
    unittest.main()
