# Aurix

**Intelligent Finance. Simplified.**

Aurix is a premium, AI-powered Financial Advisor & Expense Manager — not a chatbot bolted onto a spreadsheet, but a full financial operating system. It combines automated expense intelligence, goal-based planning, and an AI advisory layer grounded in real financial principles, wrapped in a UI built to the design bar of Stripe, Mercury, Linear, and Ramp.

This project is being built as a **Track B (Advanced)** submission — an 8-phase build with a distinctive "wow feature" layered into every phase, on top of the core functional requirements.

> **Current status:** Phases 1–6 implemented · Phases 7–8 planned.

> **Reliability hardening (Aug 2026):** a bug-fix pass shipped — semantic RAG search fully wired, live-AI guru debate schema fixed, tax calculator now models your actual 80C/80D deductions, SMS ingestion parses the transaction date, reports export to CSV, then the Phase 5 & 6 wow features (Financial Time Machine and "What If?" Simulator) were built and integrated, and lint/typecheck/tests/build all pass.

---

## ✨ What Aurix Does

- Extracts and categorizes expenses from screenshots, statements, and shared-expense apps
- Synthesizes personalized financial advice from established financial philosophies
- Tracks financial goals with honest, real-time progress
- Builds a **Financial Persona** for every user that powers personalization across the app
- Surfaces spending analytics, budgets, and financial health at a glance
- Predicts your financial future — Time Machine projections and "What If?" scenario simulation

---

## 🗺️ Feature Overview

Every route and feature shipping today, mapped to the phase that owns it:

| Area | Route | What's included | Phase |
|---|---|---|---|
| **Dashboard** | `/dashboard` | Net Worth / Monthly Spending / Savings / Financial Health stat tiles; spending vs savings trend; category donut; budget-vs-limit tracker; goals widget; recent transactions; quick AI insights | 1 |
| **Onboarding** | `/onboarding` | 5-step AI Financial Persona quiz → archetype (e.g. "The Strategic Saver") persisted to Zustand + localStorage | 1 |
| **Auth** | `/login` `/register` `/forgot-password` | Split-panel brand layout, React Hook Form + Zod validation, cookie route protection | 1 |
| **Expenses** | `/expenses` | 5 capture tabs: screenshots (OCR), bank statement CSV auto-detect (SBI/HDFC/ICICI), SMS clipboard parser (amount + merchant + **date**), manual entry, Splitwise sync · auto-categorization + review flow | 2 |
| **Reports** | `/reports` | Overview stats, spending trend, category breakdown, one-click **CSV export** | 3 |
| **Advisor** | `/advisor` | Multi-guru AI debate (7 gurus) · chat (chat/debate/insight modes with **tool detection**: forecasts, insights, recommendations, multi-tool) · Financial Health Score (8-factor) · financial timeline · live ET news feed · **🔮 "What-If?" Simulator** | 4 + 6 |
| **Goals** | `/goals` | Goals with progress % · **create-goal form** (title, type, target, saved, date) · goal-aware recommendations & health score · **⏳ Financial Time Machine** (Current → 2034 slider, compounding chart) · live Zerodha/Groww **Portfolio Tracker** tab | 5 |
| **Tax & SIP Tools** | `/goals/calculator` | Old vs New regime with §87A rebate, real §80C/§80D sliders · standard & step-up SIP compounding | 5 |
| **Knowledge Base (RAG)** | `/knowledge-base` | Upload + browse documents · semantic vector search via backend ChromaDB + keyword fallback | 4 |
| **Profile** | `/profile` | Financial Persona summary card | 1 |
| **Settings** | `/settings` | General / Notifications / Security preferences | 1 |
| **Market ticker** | app shell | Live NIFTY, SENSEX, BANK NIFTY, USD/INR quotes (Yahoo Finance) | bonus |
| **AI Assistant** | floating FAB | Slide-in assistant drawer — working chat with guru debate & tool detection | 1 + 4 |

---

## 🧱 Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4, custom design tokens (no default shadcn theme) |
| Components | Hand-built shadcn-style primitives on Radix UI |
| Animation | Framer Motion |
| State | Zustand (with persistence for the Financial Persona) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide |
| Auth | Client-side mock auth (hardcoded credentials + cookie middleware route protection); Clerk-ready structure |
| Backend | FastAPI (Python) — Grok (xAI) AI provider, ChromaDB RAG, Tesseract OCR, SQLAlchemy |
| Database | PostgreSQL via SQLAlchemy (aiosqlite fallback in dev) |
| Vector DB | ChromaDB + BAAI/bge-base-en-v1.5 embeddings |
| OCR | Tesseract.js (client) + pytesseract/OpenCV (server) |
| ML | Naive Bayes expense categorizer |

---

## ✅ Phase 1 — Project Foundation (Implemented)

Phase 1 delivers the full frontend foundation: design system, component library, core layouts, and the flagship onboarding experience — no backend logic yet beyond placeholder interactions.

### Design System
- Custom color palette (deep navy primary, emerald secondary, neutral grays) defined as CSS variables in `app/globals.css`, with full light/dark mode support
- Inter typography with a clear hierarchy (page titles → section titles → body)
- Deliberately avoids purple "AI" gradients, glassmorphism, neon, and heavy shadows

### Reusable UI Library (`components/ui/`)
Button, Card, Badge, Input, Label, Avatar, Dialog, Dropdown Menu, Tabs, Progress, Select, Separator, Tooltip, Checkbox, Skeleton, Sonner (toast) — all built on Radix primitives with consistent styling and subtle Framer Motion micro-interactions (button press spring, card hover lift).

### Marketing / Landing Page
Hero with animated stat card, feature grid (AI Advisor / Expense Tracking / Financial Goals), stats band, testimonials, closing CTA, and footer — all in `app/(marketing)/`.

### Authentication
Login, Register, and Forgot Password pages (`app/(auth)/`) with a split-panel brand layout, React Hook Form + Zod validation, show/hide password toggle, and loading states. (UI-complete; wired to simulated network calls pending real Clerk/backend integration.)

### Application Shell
- Collapsible sidebar with animated active-route indicator (`components/layout/sidebar.tsx`)
- Sticky navbar with search, notifications, theme toggle, Financial Persona badge, and user menu
- Mobile navigation drawer for responsive breakpoints

### Dashboard
Net Worth, Monthly Spending, Monthly Savings, and Financial Health stat tiles; a spending vs. savings trend chart; an expense category donut chart; a budget-vs-limit tracker; a goals progress widget; a recent transactions list; and a quick insights panel — all built on mock data in `lib/mock-data.ts`, ready to be swapped for live data.

### 🧠 Wow Feature: AI Financial Persona Setup
Instead of a plain sign-up, new users complete a 5-step guided quiz (`features/onboarding/onboarding-wizard.tsx`) covering income, savings behavior, primary financial goal, and risk appetite. A derivation engine (`lib/persona.ts`) turns those answers into an archetype:

```
Financial Persona

"The Strategic Saver"

✓ Moderate Risk
✓ Strong Budget Discipline
✓ Long-Term Thinker
✓ Emergency Fund Focus
```

The resulting persona is persisted (Zustand + localStorage) and surfaced everywhere — the navbar badge, the dashboard, and the profile page — so every future recommendation in later phases has a personalization layer to build on from day one.

### Empty, Loading & Error States
- Reusable `EmptyState` and `ErrorState` components used across Expenses, Goals, and Advisor pages
- Skeleton loading state for the dashboard route (`app/(app)/dashboard/loading.tsx`)
- Branded 404, 500 (`app/error.tsx`), and offline pages via a shared `StatusPage` component

### Floating AI Assistant
A pulsing, bottom-right floating action button opens a slide-in assistant drawer. Built as a surface in Phase 1, it has since been upgraded to a working chat with guru debate and tool detection (see Phase 4).

---

## ✅ Phase 2 — OCR & Expense Extraction (Implemented)

Receipt scanning, bank statement import, and SMS expense capture — with intelligence layered on top.

### Receipt OCR
- Screenshot upload with client-side Tesseract.js OCR and a progress indicator (`features/expenses/screenshot-upload.tsx`)
- Receipt parsing with line-item extraction and OCR confidence scoring (`lib/parse-receipt.ts`)
- Low-confidence extractions are flagged for manual review
- Server-side pytesseract + OpenCV endpoint (`app/api/ocr`, `backend/app/ocr/`)

### Bank Statement Import
- CSV upload with automatic bank detection for SBI, HDFC, and ICICI formats (`lib/parse-statement.ts`)
- Review-and-confirm flow before transactions land in the expense ledger

### SMS Expense Parser
- Parses Indian bank SMS notifications (UPI/Card/IMPS) with clipboard-paste support — extracting amount, merchant, category, *and* the transaction date from formats like `DD-Mon-YYYY` / `DD/MM/YYYY` (`features/expenses/sms-ingest.tsx`)

### 🧾 Wow Feature: AI Receipt Intelligence (partial)
Validation and confidence-flagging scaffolding exists, but LLM reasoning over line items ("This purchase belongs to Dining…") and duplicate-receipt detection are not yet wired to the AI layer.

### Missing / Next
- LLM reasoning over extracted line items
- Duplicate receipt detection

---

## ✅ Phase 3 — Smart Expense Analytics (Implemented)

A full analytics engine powers the Expenses and Reports pages (`lib/financial-engine.ts`, ~1,000 lines):

- Month-over-month and trailing 3/6-month category analysis with trend detection
- Anomaly detection via z-score, IQR, and seasonal adjustments; weekend-vs-weekday patterns; merchant frequency and spending-spike alerts; budget-overrun detection
- **ML categorization**: a Naive Bayes classifier (`lib/ml-categorize.ts`) trained on spending history, with keyword fallback (`lib/categorize.ts`)
- Custom categories with a persisted store and backend sync
- Financial health history tracking with auto-recalculation

### 🧬 Wow Feature: Spending DNA Profile (missing)
The Spending DNA radar chart (Needs / Lifestyle / Convenience / Impulse) with peer benchmarking ("You spend more on convenience than 82% of users") is **not yet built** — the analytics engine feeds it, the visualization is the next step.

---

## ✅ Phase 4 — RAG-Powered Financial Advisor (Implemented)

### Multi-Guru AI Debate
- 7 financial gurus — including Indian voices — with curated knowledge passages (`lib/guru-knowledge.ts`, `lib/financial-advice.ts`)
- Debate UI where each guru answers from their philosophy, followed by an AI summary (`features/advisor/guru-debate.tsx`)
- Advisor chat with chat / debate / insight modes and multi-tool detection

### RAG Knowledge Base
- Knowledge-base page with document upload and search (`app/(app)/knowledge-base/`)
- Full backend RAG: ChromaDB vector store, BAAI/bge-base-en-v1.5 embeddings, LangChain chunking, PyMuPDF/docx loaders (`backend/app/rag/`)
- Frontend `/api/rag/*` routes with keyword-search fallback

### Financial Health Score
- 8-factor weighted health score with history and AI-driven recommendations (`lib/financial-engine.ts`, `services/health-service.ts`)

### RAG Semantic Search (fixed)
The frontend `/api/rag/search` route now lazily embeds every curated knowledge passage through the backend embed API, ranks chunks by real cosine similarity, and synthesizes an AI answer from the top matches. If the backend is down it transparently falls back to keyword search — no more empty-vector/no-op ranking.

---

## ✅ Phase 5 — Financial Goal Planning (Implemented)

- Goals store + progress cards + full create-goal form (title, type, target, saved, target date) wired to `addGoal` (`app/(app)/goals/`)
- **Tax & SIP Calculator**: Old vs New tax regime comparison with §87A rebate, plus standard and step-up SIP compounding (`app/(app)/goals/calculator/`). The old-regime benefit is computed from *your* actual §80C and §80D investments — two new sliders let you model real contributions instead of assuming the maximum.

### ⏳ Wow Feature: Financial Time Machine
A Current → 2034 slider that projects your wealth month-by-month in real time (`features/goals/time-machine.tsx`). It starts from your wealth/retirement goal corpus, feeds in your actual monthly income (Persona) minus your average real monthly spending (live expenses), compounds at a 12% annual return, and shows animated stat cards (projected balance, future value today, growth, monthly investable) plus an invested-vs-value area chart.

---

## ✅ Phase 6 — Prediction Engine (Implemented)

- 3-month spending forecast with seasonal factors, confidence levels, and budget-overflow flags (`generatePredictionsFromData` + predictions widget on the Advisor page)

### 🔮 Wow Feature: "What If?" Simulator
Live scenario toggling on the Advisor page (`features/advisor/what-if-simulator.tsx`). Toggle real-life changes — cancel streaming, cut food delivery, 20% less dining, +₹2,000 SIP, buy a bike on EMI, or invest a ₹50,000 bonus — plus a custom monthly top-up slider, and watch the baseline-vs-scenario projection chart and projected-wealth delta (in ₹ Lakh/Crore) recalculate instantly.

---

## ⬜ Phases 7 & 8 — Not Started

- **Phase 7:** Production hardening (real auth, rate limiting, security headers) and the 🎙️ AI Voice Financial Coach
- **Phase 8:** Final deployment and the 🤖 AI Financial Copilot Dashboard briefing

---

## 🎁 Bonus Features (beyond the roadmap)

- **Live Zerodha Kite integration** — real holdings fetch from `api.kite.trade` with sandbox fallback; Portfolio Tracker tab on the Goals page (`app/api/zerodha/holdings`)
- **Live financial news** — Economic Times RSS scraper with category classification and fallback feed (`app/api/news`, `features/advisor/financial-news-feed.tsx`)
- **Market ticker** — Yahoo Finance live quotes (NIFTY, SENSEX, BANK NIFTY, USD/INR) in the app shell (`components/layout/market-ticker.tsx`, `app/api/market`)
- **Splitwise sync UI** — balance overview with API proxy and demo sandbox (`app/api/splitwise`)
- **FastAPI backend** — Grok (xAI) AI with retries/streaming, ChromaDB RAG, Tesseract OCR, SQLAlchemy data model, and a pytest suite (`backend/`)
- **Backend data sync** — transactions, goals, and categories auto-sync to the backend (`components/data-initializer.tsx`)
- **AI assistant drawer** — upgraded from the Phase-1 placeholder to a working chat with guru debate and tool detection

---

## 📂 Project Structure

```
app/                # Next.js App Router routes (marketing, auth, app, onboarding, API routes)
components/
  ui/               # Reusable design-system primitives
  layout/           # Sidebar, navbar, auth layout, mobile nav, market ticker
  shared/           # Cross-feature building blocks (empty/error states, page header, etc.)
features/           # Feature-scoped UI: landing, auth, onboarding, dashboard, ai-assistant, expenses, advisor, portfolio
hooks/               # Shared React hooks
lib/                 # Utilities, financial engine, OCR/parsers, persona logic, guru knowledge, ML categorizer
providers/           # App-wide providers (theme, toaster, tooltip)
services/            # Service layer: AI client, advisor, RAG, OCR, health, sync
store/               # Zustand stores (UI, persona, expenses, goals, categories, auth)
types/               # Shared TypeScript types
constants/           # Nav config, site copy, static content
public/              # Static assets
backend/             # FastAPI — Grok AI, ChromaDB RAG, Tesseract OCR, SQLAlchemy data sync
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev       # start the dev server at http://localhost:3000
npm run build     # production build
npm run lint      # eslint
```

### Backend (optional — enables live Grok AI, RAG, OCR, and data sync)

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env   # add GROK_API_KEY, DATABASE_URL, TESSERACT_PATH, etc.
uvicorn app.main:app --reload   # http://localhost:8000
```

By default the frontend points at the backend (`NEXT_PUBLIC_AI_PROVIDER=backend`, `NEXT_PUBLIC_OCR_PROVIDER=tesseract`, `NEXT_PUBLIC_RAG_PROVIDER=chromadb` in `.env.local`). When the backend is down, the app falls back to rule-based AI and mock data.

---

## 🗺️ Roadmap — The "Wow Feature" Journey

Since this is a **Track B** build, every phase pairs its core deliverable with one standout feature designed to impress in evaluations, interviews, and demos — showing AI engineering depth and product thinking, not just checkbox functionality.

| Phase | Core Feature | Wow Feature |
|---|---|---|
| 1 ✅ | Authentication & Project Foundation | 🧠 AI Financial Persona Generator |
| 2 ✅ | OCR & Expense Extraction Engine | 🧾 AI Receipt Intelligence (partial) |
| 3 ✅ | Smart Expense Analytics | 🧬 Spending DNA Profile (missing) |
| 4 ✅ | RAG-Powered Financial Advisor | ⚖️ Multi-Guru AI Debate |
| 5 ✅ | Financial Goal Planning | ⏳ Financial Time Machine (interactive slider + compounding chart) |
| 6 ✅ | Prediction Engine | 🔮 Interactive "What If?" Simulator (scenario toggles) |
| 7 ⬜ | Production Hardening & Security | 🎙️ AI Voice Financial Coach |
| 8 ⬜ | Final Deployment | 🤖 AI Financial Copilot Dashboard |

---

### 🚀 Phase 2 — OCR Engine
**Wow Feature: AI Receipt Intelligence**

The OCR layer doesn't just extract line items — it reasons about them.

```
Starbucks — ₹420
Coffee · Muffin · Brownie
```

> "This purchase belongs to Dining. You've already spent ₹5,800 this month on
> Cafés — that's 18% above your average."

It also flags duplicate receipts, suspicious OCR extractions, and anomalous transactions.

*Why it impresses: combines OCR with LLM reasoning, not just text extraction.*

---

### 🚀 Phase 3 — Smart Expense Analytics
**Wow Feature: Spending DNA**

Instead of another pie chart, Aurix builds a spending personality profile:

```
Your Spending DNA

45% Needs
25% Lifestyle
20% Convenience
10% Impulse
```

Compared against ideal financial ratios, with peer benchmarking:

> "You spend more on convenience than 82% of users."

Visualized as a radar chart.

*Why it impresses: a genuinely unique analytics format.*

---

### 🚀 Phase 4 — Financial Knowledge (RAG)
**Wow Feature: AI Debate Between Financial Gurus**

Instead of a single answer, Aurix stages a discussion across financial philosophies:

> **Question:** Should I buy an iPhone on EMI?
>
> 💰 **Warren Buffett** — Avoid liabilities.
>
> 📚 **Robert Kiyosaki** — Depends if it increases your productivity.
>
> 💼 **Ramit Sethi** — If it fits your guilt-free spending budget, go ahead.
>
> 🤖 **AI Summary** — Considering your savings, waiting 2 months is better.

*Why it impresses: an extremely memorable, demo-able moment.*

---

### 🚀 Phase 5 — Financial Planner (implemented)
**Wow Feature: Financial Time Machine**

A slider from **Current → 2034**. As the user drags it, savings, net worth, investments, and the future corpus are predicted in real time — animated stat cards, an invested-vs-value chart, and a custom monthly top-up slider.

```
If you invest your monthly surplus (+₹1,500/month top-up)

2034 Projected balance: ₹11.4 Lakhs
```

*Why it impresses: predictive visualization that makes the future tangible.*

---

### 🚀 Phase 6 — Prediction Engine (implemented)
**Wow Feature: "What If?" Simulator**

Users toggle real-life changes — remove Netflix, reduce food spend, increase SIP, buy a bike — and Aurix instantly recalculates savings, investments, future balance, and goal completion with live animations:

```
+₹4.2 Lakhs by 2032
```

*Why it impresses: interactive, consequence-driven financial planning.*

---

### 🚀 Phase 7 — Production
**Wow Feature: AI Voice Financial Coach**

A microphone-driven conversational assistant with full voice input and output:

```
🎤 "Can I afford a Goa trip next month?"
```

> "Yes — you'll still remain above your emergency fund threshold. Estimated
> budget: ₹18,000. Safe to travel."

*Why it impresses: a real AI-assistant experience, not a chat window.*

---

### 🚀 Phase 8 — Final Product
**Wow Feature: AI Financial Copilot Dashboard**

The homepage becomes a live briefing rather than a static dashboard:

```
Good Evening, Pavan 👋

You spent ₹1,250 today.
Food expenses are increasing.

Goal Completion  ████████░░ 82%

Next Recommendation: Increase SIP by ₹500
Potential Future Savings: ₹3.2 Lakhs
```

Every login generates a fresh AI briefing — daily wins ("You stayed under budget today"), alerts ("Rent is due in 3 days"), and opportunities ("You could invest ₹2,000 this month without affecting your goals").

*Why it impresses: turns Aurix from an expense tracker into a premium AI financial companion.*

---

## 🎯 Why This Roadmap Fits Track B

Each phase's wow feature directly demonstrates the capabilities Track B evaluators look for: advanced analytics (Spending DNA), retrieval-augmented generation (Multi-Guru Debate), predictive modeling (Time Machine, What-If Simulator), voice AI (Voice Coach), and a cohesive AI-native product experience (Copilot Dashboard) — layered on top of a genuinely production-grade frontend foundation, not just a proof of concept.

---

## ⚠️ Disclaimer

Aurix provides educational financial guidance synthesized from general principles and is not a substitute for advice from a licensed financial advisor.
