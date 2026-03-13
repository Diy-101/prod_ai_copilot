from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "ML Planner Service"
    app_version: str = "0.1.0"
    host: str = "0.0.0.0"
    port: int = 8001


settings = Settings()
