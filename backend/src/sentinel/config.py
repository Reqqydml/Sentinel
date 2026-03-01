from pydantic import BaseModel


class Settings(BaseModel):
    app_env: str = "dev"
    db_path: str = "./sentinel.db"
    risk_baseline_z: float = 4.0
    min_elevated_triggers: int = 3
    forced_move_gap_cp: int = 50


settings = Settings()
