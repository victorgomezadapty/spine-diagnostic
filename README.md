# Spine Diagnostic (ADAPTY)

Back pain risk assessment tool. A short questionnaire inspired by the STarT Back approach produces a risk level, a segmented risk profile (mechanical, recovery, psychosocial), a "spine age" visualization, personalized recommendations and a downloadable PDF report. Includes a B2B module where companies can estimate the cost of back pain in their workforce.

**Live demo:** https://spine-diagnostic-six.vercel.app

> Informational only. This is a functional risk assessment, not a medical diagnosis.

## Features

- 5-step assessment (profile, pain, risk factors, lifestyle, contact), bilingual ES/EN
- Risk scoring with rule-based, explained recommendations
- Spine age visualization
- PDF report download (generated in the browser)
- B2B: company registration, executive dashboard with cost analysis, protected admin panel
- Reports are stored per browser; the API has no lookup by email (privacy by design)

## Stack

React 18, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Wouter, Express, Drizzle ORM, PostgreSQL (Neon), jsPDF. Deployed on Vercel (static client plus one serverless API function).

## Run locally

```bash
npm install
cp .env.example .env   # set DATABASE_URL and ADMIN_PASSWORD
npm run db:push
npm run dev
```

## Deploy on Vercel

1. Import the repo. Framework preset: **Other**. The build command comes from `vercel.json`.
2. Add a Neon Postgres database from Vercel Storage (creates `DATABASE_URL`).
3. Set `ADMIN_PASSWORD` and `PUBLIC_URL`. Optional: `BREVO_API_KEY`, `SENDER_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `GOOGLE_SHEETS_WEBHOOK_URL`.
4. Deploy. The build syncs the database schema with `drizzle-kit push`.

The admin API (`/api/admin/*`) is closed unless `ADMIN_PASSWORD` is set; the `/admin` page asks for it.
