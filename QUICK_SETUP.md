# Sentinel Anti-Cheat: Quick Setup Guide

## ✅ What You Already Have (In the Repository)

### Models & Binaries
- ✅ **Stockfish**: `stockfish/stockfish.zip` (extract before use)
- ✅ **Maia Neural Networks**: `backend/models/maia/` (9 ELO variants + fallback)
- ✅ **XGBoost Model**: `backend/models/xgboost/v1.0/xgboost_model.json`
- ✅ **Isolation Forest**: `backend/models/isolation_forest/v1.0/isolation_forest.pkl`
- ✅ **Calibration Profiles**: `backend/calibration/` (3 variants)

### Environment Templates
- ✅ **Backend Config**: `backend/.env.example`
- ✅ **Frontend Config**: `web/.env.local` + `web/.env.example`

---

## ❌ What You Need to Get Externally

| Service | Purpose | Where to Get |
|---------|---------|-------------|
| **Supabase** | Database + Auth | https://supabase.com (sign up, create project) |
| **Redis** | Caching | Local: `docker run -d -p 6379:6379 redis` OR Cloud: Upstash |
| **Lichess API** (Optional) | Integration | https://lichess.org/account/oauth/token |
| **LLM Keys** (Optional) | AI Reports | OpenAI, Anthropic, etc. |

---

## 🚀 Setup Steps

### **1. Extract Stockfish**
```bash
cd stockfish
# Windows: Use 7-Zip or right-click → Extract All
# macOS/Linux:
unzip stockfish.zip
```

### **2. Create Backend Environment**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in these sections:

**A. Local Models** (Copy-paste these - they're ready to use):
```
STOCKFISH_PATH=../stockfish/stockfish-windows-x86-64-avx2.exe
MAIA_MODELS_DIR=./models/maia/
XGBOOST_MODEL_PATH=./models/xgboost/v1.0/xgboost_model.json
ISOLATION_FOREST_MODEL_PATH=./models/isolation_forest/v1.0/isolation_forest.pkl
CALIBRATION_PROFILE_PATH=./calibration/regan_calibration_profile.json
```

**B. Supabase** (Get from Supabase dashboard after creating project):
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # Public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Secret key
```

**C. Redis** (Local or cloud):
```
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
```

**D. Keep defaults** (optional):
```
APP_ENV=dev
DB_PATH=./sentinel.db
ANALYSIS_DEPTH=22
ANALYSIS_MULTIPV=3
RISK_BASELINE_Z=4.0
```

### **3. Create Frontend Environment**
```bash
cd web
# .env.local already exists, but check if it needs updating
# Should contain:
NEXT_PUBLIC_SENTINEL_API=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### **4. Install Dependencies**

**Backend:**
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -e .[dev]
```

**Frontend:**
```bash
cd web
npm install
```

### **5. Start the Services**

**Backend** (Terminal 1):
```bash
cd backend
.venv\Scripts\activate  # or: source .venv/bin/activate
uvicorn --app-dir src sentinel.main:app --reload --port 8000
```

**Frontend** (Terminal 2):
```bash
cd web
npm run dev
```

**Redis** (Terminal 3 - if running locally):
```bash
redis-server
# Or use Docker:
docker run -d -p 6379:6379 redis
```

---

## 🎯 Verify Everything Works

1. **Backend API**: Open http://localhost:8000/docs (Swagger UI)
   - Should show all endpoints
   - Try `/v1/health` endpoint

2. **Frontend**: Open http://localhost:3000
   - Dashboard should load
   - API connection should work

3. **Check logs**:
   ```bash
   # Backend should say: "Application startup complete"
   # Frontend should say: "Ready in X.XXs"
   ```

---

## 📂 File Locations You'll Need

```
Sentinel/
├── backend/
│   ├── models/
│   │   ├── maia/              ✅ (9 models ready)
│   │   ├── xgboost/           ✅ (ready)
│   │   └── isolation_forest/  ✅ (ready)
│   ├── calibration/           ✅ (3 profiles ready)
│   ├── .env.example           ✅ (template)
│   └── .env                   (create & fill in)
├── web/
│   ├── .env.local             ✅ (mostly ready)
│   └── .env.example           ✅ (template)
└── stockfish/
    └── stockfish.zip          ✅ (extract this)
```

---

## 🔗 External Setup Links

1. **Supabase**
   - Sign up: https://supabase.com
   - Create new project
   - Go to Settings → API
   - Copy Project URL and Public Anon Key and Service Role Key

2. **Redis**
   - Local: `docker run -d -p 6379:6379 redis`
   - Cloud: https://upstash.com (Redis cloud)

3. **Lichess** (Optional)
   - https://lichess.org/account/oauth/token
   - Generate Personal Access Token

---

## ✨ Environment Variable Checklist

- [ ] `STOCKFISH_PATH` - Set to extracted binary
- [ ] `MAIA_MODELS_DIR` - Points to `backend/models/maia/`
- [ ] `XGBOOST_MODEL_PATH` - Points to model.json
- [ ] `ISOLATION_FOREST_MODEL_PATH` - Points to .pkl file
- [ ] `CALIBRATION_PROFILE_PATH` - Points to JSON file
- [ ] `SUPABASE_URL` - From Supabase dashboard
- [ ] `SUPABASE_ANON_KEY` - From Supabase dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase settings (secret)
- [ ] `REDIS_URL` - redis://localhost:6379/0 (or your cloud URL)
- [ ] `REDIS_PASSWORD` - Empty for local, required for cloud

---

## 🆘 Troubleshooting

**"Stockfish not found"**
- Make sure you extracted the .zip file
- Check path in STOCKFISH_PATH uses forward slashes or escaped backslashes
- Verify file exists: `ls` or `dir` the directory

**"Cannot connect to Supabase"**
- Verify SUPABASE_URL format (should start with https://)
- Check ANON_KEY and SERVICE_ROLE_KEY are correct (not truncated in .env)

**"Redis connection refused"**
- Start Redis: `redis-server` or `docker run -d -p 6379:6379 redis`
- Check REDIS_URL matches your setup

**"Models not found"**
- Verify paths use forward slashes: `backend/models/maia/`
- Not: `backend\models\maia\`

**Frontend 404 on API calls**
- Make sure backend is running on 8000
- Check NEXT_PUBLIC_SENTINEL_API=http://localhost:8000 in web/.env.local

---

## 📊 Architecture Overview

```
┌─────────────────┐
│   Web Browser   │
│   localhost:3   │
│   000 (Next.js) │
└────────┬────────┘
         │ API calls
         ↓
┌─────────────────────┐
│  Backend FastAPI    │
│  localhost:8000     │
└────────┬────────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ↓                     ↓
┌─────────────┐      ┌────────────┐
│ Supabase    │      │ Redis      │
│ (Database)  │      │ (Cache)    │
└─────────────┘      └────────────┘
    │                     │
    └────────────────┬────┘
                     ↓
              ┌─────────────────┐
              │ ML Models       │
              │ • Maia (Neural) │
              │ • XGBoost       │
              │ • Isolation F.  │
              │ • Stockfish     │
              └─────────────────┘
```

---

## 💡 Pro Tips

1. **Development**: Use `--reload` flag on backend to auto-restart on code changes
2. **Debugging**: Add `console.log("[v0] ...")` in frontend, check browser console
3. **API Testing**: Use Swagger UI at `http://localhost:8000/docs`
4. **Database**: Supabase has a web SQL editor - useful for testing queries
5. **Models**: If a model path is wrong, system falls back to heuristic (no crash)

---

Ready to go! Start with step 1 above. 🚀
