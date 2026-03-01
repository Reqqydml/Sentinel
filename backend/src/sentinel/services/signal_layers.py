from __future__ import annotations

from sentinel.domain.models import AggregatedFeatures, SignalResult


def layer_1_ipr(f: AggregatedFeatures) -> SignalResult:
    reasons = []
    triggered = f.ipr_z_score >= 4.0
    if f.ipr_z_score >= 4.0:
        reasons.append("IPR delta exceeds conservative Z >= 4.0 threshold")
    if f.top3_match_pct > 0.85:
        reasons.append("Top-3 engine match unusually high")
    return SignalResult(
        name="Layer1_IPR_MoveQuality",
        triggered=triggered,
        score=f.ipr_z_score,
        threshold=4.0,
        reasons=reasons,
    )


def layer_2_complexity(f: AggregatedFeatures) -> SignalResult:
    score = f.complexity_accuracy_ratio
    triggered = score > 1.0 and f.accuracy_in_complex_positions > 0.7
    reasons = []
    if score > 1.0:
        reasons.append("Accuracy in complex positions exceeds simple positions")
    if f.critical_moment_accuracy > 0.75:
        reasons.append("Critical moment accuracy is elevated")
    return SignalResult(
        name="Layer2_ComplexityAdjusted",
        triggered=triggered,
        score=score,
        threshold=1.0,
        reasons=reasons,
    )


def layer_3_timing(f: AggregatedFeatures) -> SignalResult:
    if not f.timing_available:
        return SignalResult(
            name="Layer3_TimeComplexity",
            triggered=False,
            score=0.0,
            threshold=0.3,
            reasons=["Clock data absent; layer excluded"],
        )

    corr = f.time_complexity_correlation if f.time_complexity_correlation is not None else 0.0
    fast = f.fast_engine_move_rate if f.fast_engine_move_rate is not None else 0.0
    ratio = f.avg_time_complex_vs_simple if f.avg_time_complex_vs_simple is not None else 0.0

    triggered = corr < 0.1 or fast > 0.6 or ratio < 1.4
    reasons = []
    if corr < 0.1:
        reasons.append("Weak time-vs-complexity correlation")
    if fast > 0.6:
        reasons.append("High rate of fast engine-like moves in complex positions")
    if ratio < 1.4:
        reasons.append("Complex positions not receiving expected extra think time")

    return SignalResult(
        name="Layer3_TimeComplexity",
        triggered=triggered,
        score=1.0 - corr,
        threshold=0.7,
        reasons=reasons,
    )


def layer_4_historical(f: AggregatedFeatures) -> SignalResult:
    score = max(
        abs(f.acl_z_score_vs_self or 0.0),
        abs(f.ipr_z_score_vs_self or 0.0),
        abs(f.performance_spike_z_score or 0.0),
    )
    triggered = score >= 3.0
    reasons = []
    if f.cold_start:
        reasons.append("Cold start profile (<10 games); historical confidence reduced")
    if triggered:
        reasons.append("Performance significantly deviates from player baseline")

    return SignalResult(
        name="Layer4_HistoricalBaseline",
        triggered=triggered,
        score=score,
        threshold=3.0,
        reasons=reasons,
    )


def layer_5_behavioral(f: AggregatedFeatures) -> SignalResult:
    score = (1.0 - f.blunder_rate) + (1.0 - f.inaccuracy_rate)
    triggered = f.blunder_rate < 0.01 and f.inaccuracy_rate < 0.08 and f.move_quality_clustering < 0.2
    reasons = []
    if triggered:
        reasons.append("Near-zero blunder/inaccuracy profile in analyzed complex window")

    return SignalResult(
        name="Layer5_BehavioralConsistency",
        triggered=triggered,
        score=score,
        threshold=1.8,
        reasons=reasons,
    )


def evaluate_all_layers(f: AggregatedFeatures) -> list[SignalResult]:
    return [
        layer_1_ipr(f),
        layer_2_complexity(f),
        layer_3_timing(f),
        layer_4_historical(f),
        layer_5_behavioral(f),
    ]
