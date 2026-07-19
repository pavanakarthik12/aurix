# Aurix

**Intelligent Finance. Simplified.**

Aurix is a premium, AI-powered Financial Advisor & Expense Manager — not a chatbot bolted onto a spreadsheet, but a full financial operating system. It combines automated expense intelligence, goal-based planning, and an AI advisory layer grounded in real financial principles, wrapped in a UI built to the design bar of Stripe, Mercury, Linear, and Ramp.

This project is being built as a **Track B (Advanced)** submission — an 8-phase build with a distinctive "wow feature" layered into every phase, on top of the core functional requirements.

---

## ✨ What Aurix Does

- Extracts and categorizes expenses from screenshots, statements, and shared-expense apps
- Synthesizes personalized financial advice from established financial philosophies
- Tracks financial goals with honest, real-time progress
- Builds a **Financial Persona** for every user that powers personalization across the app
- Surfaces spending analytics, budgets, and financial health at a glance

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
| Auth (structure) | Clerk |
| Backend (structure, future) | FastAPI |
| Database (future) | PostgreSQL + Prisma |

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
A pulsing, bottom-right floating action button opens a slide-in assistant drawer. The assistant itself is a placeholder in Phase 1 — the surface is built so Phase 4/7's real advisory and voice features drop in without UI rework.

---

## 📂 Project Structure

```
app/                # Next.js App Router routes (marketing, auth, app, onboarding)
components/
  ui/               # Reusable design-system primitives
  layout/           # Sidebar, navbar, auth layout, mobile nav
  shared/           # Cross-feature building blocks (empty/error states, page header, etc.)
features/           # Feature-scoped UI: landing, auth, onboarding, dashboard, ai-assistant
hooks/               # Shared React hooks
lib/                 # Utilities, formatting, mock data, persona logic
providers/           # App-wide providers (theme, toaster, tooltip)
services/            # Future API/service layer
store/               # Zustand stores (UI state, financial persona)
types/               # Shared TypeScript types
constants/           # Nav config, site copy, static content
public/              # Static assets
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev       # start the dev server at http://localhost:3000
npm run build     # production build
npm run lint      # eslint
```

---

## 🗺️ Roadmap — The "Wow Feature" Journey

Since this is a **Track B** build, every phase pairs its core deliverable with one standout feature designed to impress in evaluations, interviews, and demos — showing AI engineering depth and product thinking, not just checkbox functionality.

| Phase | Core Feature | Wow Feature |
|---|---|---|
| 1 ✅ | Authentication & Project Foundation | 🧠 AI Financial Persona Generator |
| 2 | OCR & Expense Extraction Engine | 🧾 AI Receipt Intelligence |
| 3 | Smart Expense Analytics | 🧬 Spending DNA Profile |
| 4 | RAG-Powered Financial Advisor | ⚖️ Multi-Guru AI Debate |
| 5 | Financial Goal Planning | ⏳ Financial Time Machine |
| 6 | Prediction Engine | 🔮 Interactive "What If?" Simulator |
| 7 | Production Hardening & Security | 🎙️ AI Voice Financial Coach |
| 8 | Final Deployment | 🤖 AI Financial Copilot Dashboard |

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

### 🚀 Phase 5 — Financial Planner
**Wow Feature: Financial Time Machine**

A slider from **Current → 2030**. As the user drags it, the AI predicts savings, net worth, investments, emergency fund, and debt trajectory — animated in real time.

```
If you reduce Swiggy by ₹2,500/month

2030 Savings: ₹8.6 Lakhs
```

*Why it impresses: predictive visualization that makes the future tangible.*

---

### 🚀 Phase 6 — Prediction Engine
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
