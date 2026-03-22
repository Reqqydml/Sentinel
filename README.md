# Sentinel Anti-Cheat (Hamduk Spec Scaffold)

This repository is an implementation scaffold for the Hamduk Labs chess integrity specification.

## Project layout

- `backend/`: FastAPI service with five-layer signal engine and immutable audit logging
- `web/`: Next.js operator dashboard shell
- `supabase/schema.sql`: Postgres schema for players, events, games, move features, and analyses

## Implemented now

- Five independent signal layers with explainable per-layer reasons
- Weighted fusion with severe-signal override (prevents rigid 3-of-5 blind spots)
- Cold-start confidence downgrade (detection remains active for new players)
- High-stakes clock policy: missing `%clk` is rejected for official analysis
- Analysis-window filtering hooks (opening/tablebase/forced move exclusions)
- Stockfish-backed PGN analysis endpoint (`/v1/analyze-pgn`) with MultiPV and move-level feature extraction
- SQLite audit trail + Supabase persistence (`players/events/analyses`)

## Still required for full production parity with the specification

- Engine-performance tuning and calibration against benchmark datasets
- Polyglot/Syzygy production data provisioning and quality checks
- Trained XGBoost + IsolationForest calibration pipeline and model versioning
- Supabase auth/row-level security and API persistence wiring
- Full investigation workflow UI (case management, SHAP charting, arbiter review actions)

## Backend run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
python -m uvicorn sentinel.main:app --reload --port 8000
```

If editable install has not been run yet, use:

```bash
uvicorn --app-dir src sentinel.main:app --reload --port 8000
```

Backend env:

- Copy `backend/.env.example` to `backend/.env`
- `STOCKFISH_PATH` is prefilled to your extracted executable
- Fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Fill `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_PREFIX`

## Web run

```bash
cd web
npm install
npm run dev
```

Web env:

- Copy `web/.env.example` to `web/.env.local`
- Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Where to put PGN:

- Open `http://localhost:3000`
- Use **PGN Analysis Console**
- Paste PGN into **PGN Text**
- Submit to call `POST /v1/analyze-pgn`

## Database setup (Supabase/Postgres)

Run `supabase/schema.sql` against your database.

## API endpoint

- `GET /health`
- `POST /v1/analyze`
- `POST /v1/analyze-pgn` (Stockfish-backed; requires `STOCKFISH_PATH`)

Persistence:

- `/v1/analyze`: writes `analyses` + identity upserts
- `/v1/analyze-pgn`: writes `analyses`, `games`, `move_features`, `engine_evals`

The analyze response returns:

- `risk_tier` (`LOW`, `MODERATE`, `ELEVATED`, `HIGH_STATISTICAL_ANOMALY`)
- `confidence`
- `analyzed_move_count`
- `weighted_risk_score`
- `signals[]` with score/threshold/reasons per layer
- immutable `audit_id`
