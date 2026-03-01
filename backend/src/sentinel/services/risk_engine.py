from __future__ import annotations

from sentinel.config import settings
from sentinel.domain.models import AggregatedFeatures, RiskTier, SignalResult


def _confidence(features: AggregatedFeatures, triggered: int) -> float:
    base = min(1.0, features.analyzed_move_count / 80.0)
    trigger_boost = min(0.35, triggered * 0.08)
    if features.cold_start:
        base *= 0.75
    return round(max(0.05, min(0.99, base + trigger_boost)), 3)


def classify(features: AggregatedFeatures, layers: list[SignalResult]) -> tuple[RiskTier, float, list[str]]:
    triggered = [x for x in layers if x.triggered]
    trigger_count = len(triggered)
    explanation: list[str] = []

    if features.analyzed_move_count < 15:
        explanation.append("Small analysis window; confidence reduced")

    tier = RiskTier.LOW
    if trigger_count >= settings.min_elevated_triggers:
        severe = any(x.name == "Layer1_IPR_MoveQuality" and x.score >= 4.5 for x in triggered)
        if severe and trigger_count >= 4:
            tier = RiskTier.HIGH_STATISTICAL_ANOMALY
            explanation.append("Multiple independent layers and severe IPR anomaly")
        else:
            tier = RiskTier.ELEVATED
            explanation.append("At least three independent anomaly layers exceeded thresholds")
    elif trigger_count >= 2:
        tier = RiskTier.MODERATE
        explanation.append("Multiple weak-to-moderate signals observed")

    if features.cold_start and tier in {RiskTier.ELEVATED, RiskTier.HIGH_STATISTICAL_ANOMALY}:
        layers_1_to_3 = {x.name for x in triggered if x.name in {
            "Layer1_IPR_MoveQuality", "Layer2_ComplexityAdjusted", "Layer3_TimeComplexity"
        }}
        if len(layers_1_to_3) < 3:
            tier = RiskTier.MODERATE
            explanation.append("Cold-start cap applied due to limited historical games")

    if tier == RiskTier.HIGH_STATISTICAL_ANOMALY:
        explanation.append("Human arbiter review required before action")

    conf = _confidence(features, trigger_count)
    return tier, conf, explanation
