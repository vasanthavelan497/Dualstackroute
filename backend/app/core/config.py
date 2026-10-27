from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "DualStackRoute"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./dualstackroute.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Illustrative Cost Function Weights:
    # Cost = 0.5 * Total Latency + 20 * End-to-End Packet Loss (%) + 5 * Hop Count
    DEFAULT_LATENCY_WEIGHT: float = 0.5
    DEFAULT_LOSS_WEIGHT: float = 20.0
    DEFAULT_HOP_WEIGHT: float = 5.0

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")


settings = Settings()
