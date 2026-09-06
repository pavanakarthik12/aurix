# AURIX PRODUCTION HARDENING AUDIT

**Date**: 2026-09-06  
**Status**: Audit Complete — Fixing Issues  
**Target**: Vercel Production Deployment

---

## EXECUTIVE SUMMARY

### Architecture Overview
- **Frontend**: Next.js 16.2.10 + React 19.2.4 + TypeScript
- **Backend**: FastAPI + Python 3.12+ (SQLAlchemy, ChromaDB, Tesseract OCR)
- **AI Provider**: Grok (via Groq API) - actually using Groq's Llama 3.3 70B
- **Database**: SQLite (local dev) / PostgreSQL (intended production)
- **RAG**: ChromaDB + sentence-transformers (BGE embeddings)
- **OCR**: Tesseract.js (frontend fallback) + pytesseract (backend)
- **State Management**: Zustand (persisted to localStorage)

### Current Deployment Status
❌ **NOT PRODUCTION READY**

---

## CRITICAL ISSUES (P0) — APPLICATION BREAKING

### P0-1: BACKEND ARCHITECTURE INCOMPATIBLE WITH VERCEL
**Status**: 🔴 CRITICAL  
**Impact**: Application cannot deploy to Vercel as configured

**Problem**:
- Next.js frontend expects FastAPI backend at `http://localhost:8000`
- `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Vercel cannot run FastAPI Python backend alongside Next.js
- No vercel.json configuration exists
- Backend will NOT deploy automatically

**Required Fix**:
1. Deploy FastAPI backend separately (Railway, Render, AWS Lambda, Google Cloud Run)
2. Update `NEXT_PUBLIC_API_URL` to point to hosted backend
3. Or implement Next.js API routes as proxy to backend
4. Or move critical backend logic to Next.js API routes

---

### P0-2: EXPOSED API KEY IN COMMITTED .env FILE
**Status**: 🔴 CRITICAL SECURITY ISSUE  
**Impact**: API credentials exposed in version control

**Problem**:
- `backend/.env` contained actual Groq API key (now sanitized)
- File was in version control
- `.gitignore` includes `backend/.env` but file already tracked

**Required Fix**:
1. IMMEDIATELY rotate the Groq API key
2. Remove `backend/.env` from git history: `git filter-branch` or BFG Repo-Cleaner
3. Add new key only to Vercel environment variables and backend hosting
4. Verify `.gitignore` prevents future commits

---

### P0-3: MISSING VERCEL CONFIGURATION
**Status**: 🔴 BLOCKS DEPLOYMENT  
**Impact**: Deployment will fail or behave unexpectedly

**Problem**:
- No `vercel.json` exists
- `next.config.ts` only has `allowedDevOrigins`
- No build configuration for production
- No environment variable documentation for Vercel

**Required Fix**:
Create `vercel.json` with proper configuration for Next.js deployment

---

### P0-4: HARDCODED LOCALHOST URLS
**Status**: 🔴 BREAKS PRODUCTION  
**Impact**: All API calls will fail in production

**Problem**:
- `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
- This value is embedded in client-side code
- Production build will make requests to `localhost` (won't work)

**Required Fix**:
- Create `.env.production` with production backend URL
- Update Vercel environment variables with `NEXT_PUBLIC_API_URL=<production-backend-url>`

---

### P0-5: DATABASE URL MISMATCH
**Status**: 🔴 DATA LAYER BROKEN  
**Impact**: Backend will fail in production

**Problem**:
- `backend/app/core/config.py` defaults to PostgreSQL: `postgresql://postgres:postgres@localhost:5432/aurix`
- `backend/.env` uses SQLite: `sqlite+aiosqlite:///./data/aurix.db`
- SQLite file won't exist in production
- No PostgreSQL connection configured for production

**Required Fix**:
- Provision PostgreSQL database (Vercel Postgres, Supabase, Railway, etc.)
- Set `DATABASE_URL` in backend hosting environment variables
- Run migrations: `alembic upgrade head`

---

## HIGH PRIORITY ISSUES (P1) — FEATURE BREAKING

### P1-1: GROK API CONFIGURATION CONFUSION
**Status**: 🟡 MISLEADING  
**Impact**: Documentation doesn't match implementation

**Problem**:
- Backend claims to use "Grok (xAI)" but actually uses Groq (different company)
- `backend/.env` has `GROK_API_BASE=https://api.groq.com/openai/v1` (Groq API)
- `GROK_MODEL=llama-3.3-70b-versatile` (Groq's Llama model)
- xAI's Grok API is `https://api.x.ai/v1` with model `grok-beta`

**Fix Required**:
Rename all "GROK" variables to "GROQ" for accuracy, or actually use xAI's Grok API

---

### P1-2: NO ERROR BOUNDARIES IN FRONTEND
**Status**: 🟡 CRASHES NOT HANDLED  
**Impact**: Single component error crashes entire page

**Problem**:
- `app/error.tsx` exists but not used consistently
- No error boundaries around dashboard widgets
- API failures cause white screen

**Fix Required**:
- Add React Error Boundaries to critical components
- Implement proper error fallback UIs

---

### P1-3: MISSING LOADING STATES
**Status**: 🟡 POOR UX  
**Impact**: Users see blank screens during data fetching

**Problem**:
- `app/(app)/dashboard/loading.tsx` exists but only shows during page transitions
- Individual widgets don't show loading states
- `useEffect` hooks fetch data without loading indicators

**Files Affected**:
- `app/(app)/dashboard/page.tsx` - no loading state for insights/recommendations
- Dashboard widgets - instant render with stale/empty data

**Fix Required**:
- Add loading states to all async data fetches
- Show skeleton screens or spinners

---

### P1-4: DUPLICATE API REQUESTS
**Status**: 🟡 PERFORMANCE ISSUE  
**Impact**: Multiple unnecessary API calls on render

**Problem in `app/(app)/dashboard/page.tsx`**:
```typescript
useEffect(() => {
  getSpendingInsights().then(setInsights).catch(() => {});
  const t = setTimeout(() => {
    setRecommendations(getAIRecommendations());
  }, 0);
  getFinancialHealthScore().then(setHealthScore).catch(() => {});
  return () => clearTimeout(t);
}, []);
```

**Issues**:
- No dependency array validation
- `setTimeout(..., 0)` is pointless
- Empty catch blocks hide errors
- Re-renders trigger new requests

**Fix Required**:
- Use proper dependency arrays
- Implement request deduplication
- Add loading/error states
- Consider React Query or SWR

---

### P1-5: RAG SYSTEM NOT CONNECTED
**Status**: 🟡 FEATURE NON-FUNCTIONAL  
**Impact**: Document upload/search doesn't work

**Problem**:
- Frontend `rag-service.ts` tries `/api/rag/search` (Next.js route)
- Next.js API route `app/api/rag/search/route.ts` doesn't exist
- Backend has `/api/v1/rag/search` but frontend doesn't call it
- Mock data returned instead

**Fix Required**:
- Create Next.js API proxy routes OR
- Update frontend to call backend directly (`${apiUrl}/api/v1/rag/search`)

---

### P1-6: OCR PROCESSING UNRELIABLE
**Status**: 🟡 DATA QUALITY ISSUE  
**Impact**: Extracted transaction data often incorrect

**Problem in `backend/app/ocr/extractor.py`**:
- Simple regex parsing: `r"(?:total|amount|due).*?[₹$€£]?\s*([\d,]+\.?\d*)"`
- No AI-based extraction
- Merchant is just first line of text
- Date extraction is basic regex
- No validation of extracted data
- Confidence hardcoded to 70

**Fix Required**:
- Use AI model for structured extraction (Groq vision or GPT-4 Vision)
- Add validation rules
- Calculate real confidence scores
- Handle extraction failures gracefully

---

### P1-7: NO TRANSACTION DEDUPLICATION
**Status**: 🟡 DATA INTEGRITY ISSUE  
**Impact**: Users can accidentally create duplicate transactions

**Problem**:
- `store/expenses-store.ts` just adds transactions without checking
- No unique constraint on (merchant, amount, date)
- Multiple CSV imports or OCR scans create duplicates

**Fix Required**:
- Implement duplicate detection algorithm
- Check (merchant_normalized, amount, date) before adding
- Show warning: "Similar transaction already exists"

---

### P1-8: SPLITWISE INTEGRATION NOT IMPLEMENTED
**Status**: 🟡 ADVERTISED FEATURE MISSING  
**Impact**: Feature mentioned but doesn't work

**Problem**:
- `app/api/splitwise/route.ts` exists but is likely mock
- No Splitwise OAuth flow
- No sync service

**Fix Required**:
- Remove Splitwise references OR
- Implement OAuth + sync using Splitwise API

---

## MEDIUM PRIORITY ISSUES (P2) — UX/API PROBLEMS

### P2-1: AI ADVISOR CAN HALLUCINATE NUMBERS
**Status**: 🟠 DATA ACCURACY RISK  
**Impact**: AI might generate fake financial data

**Current Protection**:
- Advisor API includes actual transaction data in prompt
- System prompt says "CRITICAL: Every insight must be based on actual data"
- Fallback to calculated insights if AI fails

**Remaining Risk**:
- AI can still fabricate transaction details
- No post-processing validation of AI response numbers

**Fix Required**:
- Parse AI responses and validate all numbers against actual data
- Reject responses containing unverifiable claims
- Always show data source for every number

---

### P2-2: FINANCIAL HEALTH SCORE PARTIALLY HARDCODED
**Status**: 🟠 MISLEADING METRICS  
**Impact**: Some scores don't reflect real data

**Problem in `services/health-service.ts`**:
```typescript
debtRatio: 82,  // hardcoded
emergencyFund: 75,  // hardcoded
expenseStability: 80,  // hardcoded
incomeGrowth: 68,  // hardcoded
investmentRatio: 52,  // hardcoded
```

Backend has proper calculations but frontend doesn't use them.

**Fix Required**:
- Remove hardcoded values
- Call backend `/api/v1/intelligence/summary` for real scores
- Or implement proper frontend calculation

---

### P2-3: CORS CONFIGURATION TOO PERMISSIVE IN DEV
**Status**: 🟠 SECURITY CONCERN  
**Impact**: Potential security issue if misconfigured in production

**Current Config** (`backend/app/core/config.py`):
```python
CORS_ORIGINS: list[str] = ["http://localhost:3000"]
```

**Problem**:
- Hardcoded localhost
- No production domain configured
- Would need manual update for each deployment

**Fix Required**:
- Read CORS origins from environment variable
- Allow multiple origins (dev, staging, production)
- Never use `allow_origins=["*"]` in production

---

### P2-4: MISSING INPUT VALIDATION
**Status**: 🟠 SECURITY + DATA QUALITY  
**Impact**: Malformed data can crash backend

**Examples**:
- `/api/v1/intelligence/summary` accepts any income value
- `/api/v1/ocr/receipt` doesn't validate base64 size
- No max file size enforcement on document uploads

**Fix Required**:
- Add Pydantic validators for all request models
- Enforce max upload size limits
- Validate all user inputs

---

### P2-5: NO API RETRY LOGIC IN FRONTEND
**Status**: 🟠 RELIABILITY ISSUE  
**Impact**: Transient network errors cause permanent failures

**Problem**:
- `services/ai-client.ts` makes single request attempt
- No exponential backoff
- No retry on 5xx errors

Backend has retry logic in Grok provider, but frontend doesn't.

**Fix Required**:
- Implement exponential backoff for API calls
- Retry 429 (rate limit) and 503 (service unavailable)
- Show user-friendly error messages

---

### P2-6: TRANSACTION CATEGORIZATION NOT LEARNED
**Status**: 🟠 FEATURE INCOMPLETE  
**Impact**: User corrections aren't persisted

**Problem**:
- Backend has `merchant_category` table and learning endpoint
- Frontend doesn't call `/api/v1/intelligence/learn-category`
- Manual category corrections are lost

**Fix Required**:
- When user changes category, call learning endpoint
- Store in database via backend
- Auto-suggest categories based on merchant history

---

### P2-7: ANALYTICS CHARTS USE MOCK DATA IN PLACES
**Status**: 🟠 MISLEADING VISUALS  
**Impact**: Charts may not reflect actual user data

**Need to Audit**:
- `features/dashboard/widgets/spending-trend-chart.tsx`
- `features/dashboard/widgets/expense-categories.tsx`
- Verify all data comes from `useExpensesStore` not mock constants

---

### P2-8: NO OFFLINE SUPPORT DESPITE OFFLINE PAGE
**Status**: 🟠 INCOMPLETE FEATURE  
**Impact**: Offline page exists but no PWA configured

**Problem**:
- `app/offline/page.tsx` exists
- No service worker
- No manifest.json
- Not a PWA

**Fix or Remove**:
- Implement full PWA with service worker OR
- Remove offline page

---

## MINOR ISSUES (P3) — POLISH & OPTIMIZATION

### P3-1: Unused Dependencies
- `firebase` in package.json but not used
- `tw-animate-css` might be redundant with Framer Motion

### P3-2: Console Errors/Warnings Not Cleaned
- Empty catch blocks hide errors
- `console.log` statements in production code

### P3-3: No Database Indexes
- Backend models don't define indexes
- Queries will be slow with real data volume

### P3-4: No Rate Limiting
- Backend has no rate limiting middleware
- Could be abused

### P3-5: No Request Logging
- No structured API request logging
- Hard to debug production issues

### P3-6: No Health Check Monitoring
- `/health` endpoint exists but not monitored
- No alerting on backend failures

### P3-7: No Build Optimization
- Next.js config doesn't enable compression
- No image optimization configured

---

## ENVIRONMENT VARIABLES AUDIT

### Frontend (.env.local) - SAFE TO EXPOSE
```
NEXT_PUBLIC_AI_PROVIDER=backend
NEXT_PUBLIC_API_URL=http://localhost:8000  ← MUST CHANGE FOR PRODUCTION
NEXT_PUBLIC_APP_URL=http://localhost:3000  ← MUST CHANGE FOR PRODUCTION
NEXT_PUBLIC_OCR_PROVIDER=tesseract
NEXT_PUBLIC_CHUNK_SIZE=512
NEXT_PUBLIC_CHUNK_OVERLAP=64
```

### Backend (.env) - MUST REMAIN SECRET
```
GROK_API_KEY=<COMPROMISED - NEEDS ROTATION>  ← P0 SECURITY ISSUE
GROK_API_BASE=https://api.groq.com/openai/v1
GROK_MODEL=llama-3.3-70b-versatile
DATABASE_URL=sqlite+aiosqlite:///./data/aurix.db  ← WON'T WORK IN PRODUCTION
REDIS_URL=redis://localhost:6379/0  ← NOT PROVISIONED
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"  ← WINDOWS-SPECIFIC
SECRET_KEY=change-this-to-a-random-secret-key  ← INSECURE DEFAULT
```

### Required for Vercel Production
- `NEXT_PUBLIC_API_URL` → Production backend URL
- Backend needs hosted database URL, not SQLite
- Backend needs cloud Redis or remove Celery dependency
- Tesseract must be available in backend runtime

---

## DEPLOYMENT STRATEGY RECOMMENDATIONS

### Option 1: Split Deployment (Recommended)
1. **Frontend**: Deploy to Vercel
   - Next.js application only
   - Environment variables: `NEXT_PUBLIC_API_URL=<backend-url>`
   
2. **Backend**: Deploy to Railway/Render/Cloud Run
   - FastAPI application
   - PostgreSQL database
   - Environment: All secret keys
   - Expose public HTTPS endpoint

3. **CORS**: Configure backend to allow Vercel domain

### Option 2: Vercel-Only (Requires Refactoring)
1. Move critical backend logic to Next.js API routes
2. Use Vercel Postgres for database
3. Call external AI APIs directly from Next.js API routes
4. Remove FastAPI dependency

### Option 3: Monorepo with Vercel Functions
1. Use Vercel Python Serverless Functions for backend
2. Limited by 50MB deployment size and function timeouts
3. Would require significant refactoring

**Recommendation**: **Option 1** is fastest path to production

---

## TESTING CHECKLIST BEFORE PRODUCTION

### Backend Health
- [ ] `/health` endpoint returns 200
- [ ] Database connection successful
- [ ] Groq API key valid and working
- [ ] OCR extracts text from test receipt
- [ ] RAG document upload and search works
- [ ] All environment variables set

### Frontend Build
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors
- [ ] No console errors on dashboard load
- [ ] All routes accessible
- [ ] Responsive on mobile

### Integration Tests
- [ ] Dashboard loads with real data
- [ ] Add expense manually works
- [ ] OCR receipt upload works
- [ ] AI Advisor generates response
- [ ] Financial health score calculates
- [ ] Charts display real data

### Production Environment
- [ ] HTTPS enabled
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] API keys rotated and secure
- [ ] CORS configured correctly
- [ ] Error monitoring enabled (Sentry, LogRocket, etc.)

---

## NEXT STEPS

1. ✅ Complete this audit
2. Fix P0 issues (blocks deployment)
3. Fix P1 issues (breaks features)
4. Deploy backend to hosting platform
5. Configure Vercel for frontend
6. Test production build locally
7. Deploy to Vercel
8. Monitor for errors
9. Fix P2/P3 issues iteratively

---

**Audit completed by**: Kiro AI  
**Next action**: Begin fixing P0 issues
