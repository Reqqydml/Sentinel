from __future__ import annotations

from fastapi import FastAPI

from sentinel.config import settings
from sentinel.repositories.audit import AuditRepository
from sentinel.schemas import AnalyzeRequest, AnalyzeResponse, SignalOut
from sentinel.services.feature_pipeline import compute_features
from sentinel.services.risk_engine import classify
from sentinel.services.signal_layers import evaluate_all_layers

app = FastAPI(title="Sentinel Anti-Cheat API", version="0.1.0")
audit_repo = AuditRepository(settings.db_path)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    features = compute_features(req)
    layers = evaluate_all_layers(features)
    tier, conf, explanation = classify(features, layers)

    if features.analyzed_move_count == 0:
        explanation.append("No non-trivial positions after opening/endgame/forced filtering")

    explanation.extend(r for l in layers for r in l.reasons)

    response_payload = {
        "player_id": req.player_id,
        "event_id": req.event_id,
        "risk_tier": tier.value,
        "confidence": conf,
        "analyzed_move_count": features.analyzed_move_count,
        "triggered_signals": len([l for l in layers if l.triggered]),
        "signals": [
            {
                "name": l.name,
                "triggered": l.triggered,
                "score": round(float(l.score), 4),
                "threshold": round(float(l.threshold), 4),
                "reasons": l.reasons,
            }
            for l in layers
        ],
        "explanation": explanation,
    }

    audit_id = audit_repo.write({"request": req.model_dump(), "response": response_payload})
    return AnalyzeResponse(**response_payload, audit_id=audit_id)
