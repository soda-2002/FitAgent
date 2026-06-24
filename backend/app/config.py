from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    dashscope_api_key: str = ""
    text_model: str = "qwen-plus"
    vision_model: str = "qwen-vl-plus"
    database_url: str = "sqlite+aiosqlite:///./fitagent.db"

    class Config:
        env_file = ".env"


settings = Settings()
