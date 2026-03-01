from __future__ import annotations

from statistics import mean, median

import numpy as np

from sentinel.domain.models import AggregatedFeatures
from sentinel.schemas import AnalyzeRequest, MoveInput
from sentinel.services.phase_filter import split_analysis_window, timing_available


def _safe_ratio(a: float, b: float) -> float:
    return a / b if b != 0 else 0.0


def _z(value: float | None, avg: float | None, std: float | None) -> float | None:
    if value is None or avg is None or std is None or std == 0:
        return None
    return (value - avg) / std


def _ipr_from_acl(avg_acl: float) -> float:
    ae_scaled = avg_acl / 100.0
    return 3571.0 - (15413.0 * ae_scaled)


def compute_features(req: AnalyzeRequest) -> AggregatedFeatures:
    all_moves: list[MoveInput] = [m for g in req.games for m in g.moves]
    window, analyzed = split_analysis_window(all_moves)
    if analyzed == 0:
        return AggregatedFeatures(
            analyzed_move_count=0,
            engine_match_pct=0,
            top3_match_pct=0,
            avg_centipawn_loss=0,
            median_centipawn_loss=0,
            cpl_variance=0,
            ipr_estimate=req.official_elo,
            ipr_vs_official_elo_delta=0,
            ipr_z_score=0,
            accuracy_in_complex_positions=0,
            accuracy_in_simple_positions=0,
            complexity_accuracy_ratio=0,
            critical_moment_accuracy=0,
            avg_candidate_moves_in_window=0,
            time_complexity_correlation=None,
            fast_engine_move_rate=None,
            think_then_engine_rate=None,
            avg_time_complex_vs_simple=None,
            acl_z_score_vs_self=None,
            ipr_z_score_vs_self=None,
            performance_spike_z_score=None,
            move_quality_clustering=0,
            blunder_rate=0,
            inaccuracy_rate=0,
            games_count_history=req.historical.games_count,
            timing_available=False,
            cold_start=req.historical.games_count < 10,
        )

    engine_best_match = [1 if m.player_move == m.engine_best else 0 for m in window]
    top3_match = [1 if (m.top3_match or m.player_move == m.engine_best) else 0 for m in window]
    cpl = [m.cp_loss for m in window]
    complex_moves = [m for m in window if m.complexity_score >= 3]
    simple_moves = [m for m in window if m.complexity_score <= 1]
    critical = [m for m in window if m.eval_swing_cp >= 100]

    complex_acc = mean([1 if m.player_move == m.engine_best else 0 for m in complex_moves]) if complex_moves else 0.0
    simple_acc = mean([1 if m.player_move == m.engine_best else 0 for m in simple_moves]) if simple_moves else 0.0

    avg_acl = float(mean(cpl))
    ipr = _ipr_from_acl(avg_acl)
    ipr_delta = ipr - req.official_elo
    ipr_z = ipr_delta / 100.0

    has_time = timing_available(window)
    time_corr = None
    fast_engine_rate = None
    think_then_engine = None
    time_complex_simple = None

    if has_time:
        pairs = [(m.time_spent_seconds, m.complexity_score) for m in window if m.time_spent_seconds is not None]
        if len(pairs) >= 2:
            times = np.array([p[0] for p in pairs], dtype=float)
            comps = np.array([p[1] for p in pairs], dtype=float)
            time_corr = float(np.corrcoef(times, comps)[0, 1]) if np.std(times) > 0 and np.std(comps) > 0 else 0.0

        fast_complex = [m for m in complex_moves if m.time_spent_seconds is not None and m.time_spent_seconds < 10]
        if complex_moves:
            fast_engine_rate = float(mean([1 if m.player_move == m.engine_best else 0 for m in fast_complex])) if fast_complex else 0.0
            think_then = [m for m in complex_moves if m.time_spent_seconds is not None and m.time_spent_seconds > 90]
            think_then_engine = float(mean([1 if m.player_move == m.engine_best else 0 for m in think_then])) if think_then else 0.0

        complex_times = [m.time_spent_seconds for m in complex_moves if m.time_spent_seconds is not None]
        simple_times = [m.time_spent_seconds for m in simple_moves if m.time_spent_seconds is not None]
        if complex_times and simple_times and mean(simple_times) > 0:
            time_complex_simple = float(mean(complex_times) / mean(simple_times))

    perf_spike = _z(req.performance_rating_this_event, req.historical.avg_perf, req.historical.std_perf)

    return AggregatedFeatures(
        analyzed_move_count=analyzed,
        engine_match_pct=float(mean(engine_best_match)),
        top3_match_pct=float(mean(top3_match)),
        avg_centipawn_loss=avg_acl,
        median_centipawn_loss=float(median(cpl)),
        cpl_variance=float(np.var(cpl)),
        ipr_estimate=ipr,
        ipr_vs_official_elo_delta=ipr_delta,
        ipr_z_score=ipr_z,
        accuracy_in_complex_positions=float(complex_acc),
        accuracy_in_simple_positions=float(simple_acc),
        complexity_accuracy_ratio=float(_safe_ratio(complex_acc, simple_acc if simple_acc > 0 else 0.0001)),
        critical_moment_accuracy=float(mean([1 if m.player_move == m.engine_best else 0 for m in critical])) if critical else 0.0,
        avg_candidate_moves_in_window=float(mean([m.candidate_moves_within_50cp for m in window])),
        time_complexity_correlation=time_corr,
        fast_engine_move_rate=fast_engine_rate,
        think_then_engine_rate=think_then_engine,
        avg_time_complex_vs_simple=time_complex_simple,
        acl_z_score_vs_self=_z(avg_acl, req.historical.avg_acl, req.historical.std_acl),
        ipr_z_score_vs_self=_z(ipr, req.historical.avg_ipr, req.historical.std_ipr),
        performance_spike_z_score=perf_spike,
        move_quality_clustering=float(np.var(cpl) / (avg_acl + 1.0)),
        blunder_rate=float(mean([1 if x >= 120 else 0 for x in cpl])),
        inaccuracy_rate=float(mean([1 if x >= 50 else 0 for x in cpl])),
        games_count_history=req.historical.games_count,
        timing_available=has_time,
        cold_start=req.historical.games_count < 10,
    )
