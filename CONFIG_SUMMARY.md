# Sentinel Anti-Cheat: Configuration & Environment Variables Summary

Last updated: March 23, 2026

---

## 📍 What You Can Get Now (Available in Repository)

### 1. **Model Paths** ✅ AVAILABLE
All models are located in the repository and ready to use:

**Maia Models (Neural Network):**
- `backend/models/maia/` - Directory structure with ELO-specific models
  - `backend/models/maia/maia-1100/model.pb`
  - `backend/models/maia/maia-1200/model.pb`
  - `backend/models/maia/maia-1300/model.pb`
  - `backend/models/maia/maia-1400/model.pb`
  - `backend/models/maia/maia-1500/model.pb`
  - `backend/models/maia/maia-1600/model.pb`
  - `backend/models/maia/maia-1700/model.pb`
  - `backend/models/maia/maia-1800/model.pb`
  - `backend/models/maia/maia-1900/model.pb`
  - `backend/models/maia/model.pb` (fallback model)

**XGBoost Model (ML Fusion):**
- `backend/models/xgboost/v1.0/xgboost_model.json`

**Isolation Forest Model (Anomaly Detection):**
- `backend/models/isolation_forest/v1.0/isolation_forest.pkl`

### 2. **Calibration Profiles** ✅ AVAILABLE
- `backend/calibration/regan_calibration_profile.json` (Production)
- `backend/calibration/regan_calibration_profile.qa.json` (QA/Testing)
- `backend/calibration/regan_calibration_profile.example.json` (Example reference)

### 3. **Stockfish Engine** ✅ AVAILABLE (Compressed)
- `stockfish/stockfish.zip` - Contains the Windows executable (ready to extract)

### 4. **Frontend Configuration** ✅ AVAILABLE
- Web example env: `web/.env.example`
- Already in web/.env.local with some values

---

## 📋 Environment Variables by Category

### **Backend Core (.env)**

**Application:**
```
APP_ENV=dev                          # dev, staging, production
DB_PATH=./sentinel.db               # SQLite database path
```

**Engine Configuration:**
```
STOCKFISH_PATH=/path/to/stockfish   # CRITICAL: Path to stockfish executable
ANALYSIS_DEPTH=22                   # Chess analysis depth (recommend 20-24)
ANALYSIS_MULTIPV=3                  # Multiple principal variations (3-5)
POLYGLOT_BOOK_PATH=                 # Optional: Opening book path
SYZYGY_PATH=                        # Optional: Tablebase path
```

**Maia Model Configuration:**
```
MAIA_MODELS_DIR=backend/models/maia/  # Required: Directory with ELO models
MAIA_LC0_PATH=                         # Optional: Leela Chess Zero binary
MAIA_MODEL_VERSION=maia-v1.0           # Model version identifier
MAIA_NODES=1                           # Number of nodes for inference
MAIA_THREADS=1                         # Threads per node
MAIA_BACKEND=blas                      # blas, cuda, or opencl
MAIA_TEMPERATURE=0.0                   # Temperature for neural network
MAIA_TEMP_DECAY_MOVES=0                # Decay temperature over moves
```

**ML Fusion Configuration:**
```
ML_FUSION_ENABLED=true
XGBOOST_MODEL_PATH=backend/models/xgboost/v1.0/xgboost_model.json
ISOLATION_FOREST_MODEL_PATH=backend/models/isolation_forest/v1.0/isolation_forest.pkl
ML_FUSION_WEIGHT_HEURISTIC=0.4         # Weight: heuristic signals
ML_FUSION_WEIGHT_PRIMARY=0.45          # Weight: primary signals (Regan)
ML_FUSION_WEIGHT_SECONDARY=0.15        # Weight: secondary signals (other layers)
ML_FUSION_MIN_MOVES=20                 # Minimum moves before ML scoring
```

**Risk Calibration:**
```
RISK_BASELINE_Z=4.0                 # Z-score baseline (typically 4.0-5.0)
MIN_ELEVATED_TRIGGERS=3              # Min signals for elevated risk
FORCED_MOVE_GAP_CP=50                # Centipawn gap for forced moves
```

**Supabase (Database + Auth):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...         # Public key (shared with frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Secret key (backend only)
SUPABASE_SCHEMA=public               # Schema name
PERSISTENCE_FAIL_HARD=true           # Fail if persistence unavailable
```

**Redis (Caching & Sessions):**
```
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=                      # Leave empty for local dev
REDIS_PREFIX=sentinel:               # Key prefix for namespacing
```

**CORS & Access:**
```
CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Calibration:**
```
CALIBRATION_PROFILE_PATH=backend/calibration/regan_calibration_profile.json
```

**RBAC & Federation:**
```
RBAC_ENABLED=true
TENANT_ENFORCEMENT_ENABLED=true
LICHESS_API_TOKEN=lip_XXXXXXXXX      # Lichess API integration
```

**Security:**
```
SENTINEL_ENCRYPTION_KEY=             # Base64-URL encoded 32-byte key (optional)
```

**LLM / AI Report Generation:**
```
LLM_PROVIDER=none                    # none, openai, anthropic, etc.
LLM_API_URL=
LLM_API_KEY=
LLM_MODEL=
LLM_TIMEOUT_SECONDS=45
REPORT_PDF_ENGINE=auto               # PDF generation engine
```

**Camera Ingestion:**
```
CAMERA_RAW_STORAGE_ENABLED=false
CONSENT_REQUIRED_FOR_RAW=true
```

---

### **Frontend (.env.local or .env.example)**

```
NEXT_PUBLIC_SENTINEL_API=http://localhost:8000
NEXT_PUBLIC_SENTINEL_ROLE=system_admin
NEXT_PUBLIC_FEDERATION_ID=
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
LICHESS_API_TOKEN=lip_XXXXXXXXX
```

---

## ❌ What You CANNOT Get (Requires External Setup)

### **Required External Services:**
1. **Supabase Project**
   - ❌ SUPABASE_URL
   - ❌ SUPABASE_ANON_KEY
   - ❌ SUPABASE_SERVICE_ROLE_KEY
   - Sign up at https://supabase.com and create a new project

2. **Redis Server**
   - ❌ REDIS_URL
   - ❌ REDIS_PASSWORD
   - Local: Run `redis-server` or use Docker
   - Cloud: Upstash, AWS ElastiCache, etc.

3. **Lichess API Token** (if using Lichess integration)
   - ❌ LICHESS_API_TOKEN
   - Get from https://lichess.org/account/oauth/token

4. **Encryption Key** (if needed for security)
   - ❌ SENTINEL_ENCRYPTION_KEY
   - Generate: `openssl rand -base64 32`

5. **LLM API Keys** (for AI report generation)
   - ❌ LLM_API_KEY
   - Services: OpenAI, Anthropic, etc.

6. **Stockfish Extracted Binary**
   - ✅ Available as zip, but needs extraction
   - Extract `stockfish/stockfish.zip` to a directory
   - Path for Windows: `stockfish/stockfish-windows-x86-64-avx2.exe`

---

## 🚀 Quick Setup for Local Development

### **Step 1: Extract Stockfish**
```bash
cd stockfish
# Windows
Expand-Archive stockfish.zip -DestinationPath .
# macOS/Linux
unzip stockfish.zip
```

### **Step 2: Backend Setup**
```bash
cd backend
cp .env.example .env
```

Update these in `.env`:
```
STOCKFISH_PATH=../stockfish/stockfish-windows-x86-64-avx2.exe  # Adjust path/OS
MAIA_MODELS_DIR=./models/maia
XGBOOST_MODEL_PATH=./models/xgboost/v1.0/xgboost_model.json
ISOLATION_FOREST_MODEL_PATH=./models/isolation_forest/v1.0/isolation_forest.pkl
CALIBRATION_PROFILE_PATH=./calibration/regan_calibration_profile.json
```

For Supabase, Redis (required for full functionality):
- Create Supabase project at https://supabase.com
- Set up Redis (local: `docker run -d -p 6379:6379 redis`)
- Fill in SUPABASE_* and REDIS_* variables

### **Step 3: Start Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .[dev]
uvicorn --app-dir src sentinel.main:app --reload --port 8000
```

### **Step 4: Start Frontend**
```bash
cd web
npm install
npm run dev  # Runs on http://localhost:3000
```

---

## 📊 Configuration Matrix

| Variable | Local Dev | Staging | Production | Required | Type |
|----------|-----------|---------|------------|----------|------|
| STOCKFISH_PATH | ✅ | ✅ | ✅ | YES | Path |
| SUPABASE_URL | ❌ Setup | ✅ | ✅ | YES | URL |
| REDIS_URL | Docker | ✅ | ✅ | YES | URL |
| LLM_API_KEY | NO | Optional | Optional | NO | String |
| LICHESS_API_TOKEN | Optional | Optional | Optional | NO | String |

---

## 🔍 Current Configuration Status

### ✅ Files Already in Repository
- Stockfish executable (compressed): `stockfish/stockfish.zip`
- Maia models (9 ELO variants): `backend/models/maia/`
- XGBoost model: `backend/models/xgboost/v1.0/xgboost_model.json`
- Isolation Forest: `backend/models/isolation_forest/v1.0/isolation_forest.pkl`
- Calibration profiles (3 variants): `backend/calibration/`
- Example env files: `backend/.env.example`, `web/.env.example`

### ⚠️ Still Needed (For Full Functionality)
1. Supabase account + project credentials
2. Redis instance (local or cloud)
3. Extracted Stockfish binary (from zip)
4. Optional: Lichess API token
5. Optional: LLM API credentials (for AI reports)

---

## 🎯 Port Configuration

- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Redis**: localhost:6379 (or external)
- **Supabase**: Cloud-hosted

---

## 💾 Database

- **Primary**: Supabase PostgreSQL (production)
- **Fallback**: SQLite at `./sentinel.db` (local dev)
- **Schema**: Defined in `supabase/schema.sql`

---

## 📝 Notes

1. **Model Paths** are relative to `backend/` directory
2. **Stockfish** must be executable (chmod +x on Linux/Mac)
3. **RBAC** is enabled by default - review auth rules if customizing
4. **ML Models** will gracefully degrade if paths are incorrect (no error, just heuristic fallback)
5. **All paths** should use forward slashes or properly escaped backslashes on Windows

---

Generated for: Sentinel Anti-Cheat v0.1.0
