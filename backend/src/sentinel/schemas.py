from __future__ import annotations

from pydantic import BaseModel, Field


class MoveInput(BaseModel):
    ply: int
    engine_best: str
    player_move: str
    cp_loss: float = Field(ge=0)
    top3_match: bool = False
    complexity_score: int = Field(ge=0)
    candidate_moves_within_50cp: int = Field(ge=1)
    best_second_gap_cp: float = Field(default=0, ge=0)
    eval_swing_cp: float = Field(default=0, ge=0)
    is_opening_book: bool = False
    is_tablebase: bool = False
    is_forced: bool = False
    time_spent_seconds: float | None = Field(default=None, ge=0)


class GameInput(BaseModel):
    game_id: str
    moves: list[MoveInput]


class HistoricalProfile(BaseModel):
    games_count: int = 0
    avg_acl: float | None = None
    std_acl: float | None = None
    avg_ipr: float | None = None
    std_ipr: float | None = None
    avg_perf: float | None = None
    std_perf: float | None = None


class AnalyzeRequest(BaseModel):
    player_id: str
    event_id: str
    official_elo: int
    performance_rating_this_event: float | None = None
    games: list[GameInput]
    historical: HistoricalProfile = Field(default_factory=HistoricalProfile)


class SignalOut(BaseModel):
    name: str
    triggered: bool
    score: float
    threshold: float
    reasons: list[str]


class AnalyzeResponse(BaseModel):
    player_id: str
    event_id: str
    risk_tier: str
    confidence: float
    analyzed_move_count: int
    triggered_signals: int
    signals: list[SignalOut]
    explanation: list[str]
    audit_id: str
