# ADAPTY - Back Pain Diagnostic Tool

## Overview

ADAPTY is a healthcare SaaS application that provides a scientific back pain risk assessment tool. Users complete a multi-step questionnaire evaluating pain levels, psychological factors (based on STarT Back methodology), and lifestyle factors. The system calculates a risk score and provides personalized recommendations.

The application follows a "Clinical Precision Meets Professional Performance" design philosophy - targeting health-conscious professionals with clean, scientific credibility rather than fluffy wellness aesthetics.

## Recent Changes (February 2026)

- **Contact Gate (Step 5)**: Assessment form now requires name, email, and optional WhatsApp/phone BEFORE showing results
  - Step 5 is a required gate: name and valid email must be filled to enable "View Results" button
  - On submission, auto-creates a plan lead entry (triggers Google Sheet sync)
  - Admin email notifications removed — all lead management happens via Google Sheets

- **Results Page CTA**: Plan lead form replaced with a single "Contact me" button
  - No duplicate data capture — contact data was already collected in the gate
  - Button sends a "contact_request" event to Google Sheets with all lead + assessment data
  - Updates the plan lead status to "contact_requested" in the database

- **Google Sheets Integration**: Fixed webhook to work reliably with Google Apps Script
  - Uses `text/plain` content type for compatibility with Google Apps Script redirects
  - 30-second timeout for cold-start scenarios
  - Each event tagged with `type` field: "gate_submission" or "contact_request"
  - Data includes: name, email, phone, country, spine age, risk level, score, occupation, age, timestamp

## Previous Changes (January 2026)

- **Spine Age Feature**: Visual representation of spinal health age on results page
  - Calculates "spine age" based on risk level: low (same as real age), medium (+5-10 years), high (+10-20 years)
  - SVG spine visualization with dynamic colors based on risk level (green/yellow/red)
  - Animated glow effects and gradient overlays

- **Plan Lead Capture**: Marketing section for personalized improvement plans
  - Displays after assessment results with value proposition
  - Features grid showing 5 areas: work routine, nutrition, training, sleep, stress
  - Lead capture form (name, email, phone) saves to `plan_leads` database table
  - Admin panel section to view and manage leads with status tracking (new/contacted/converted)
  - **Google Sheets sync**: On form submission, lead data (name, email, phone, spine age, risk level, score, occupation, age, timestamp) is sent to a Google Sheet via webhook (`GOOGLE_SHEETS_WEBHOOK_URL` env var). Uses Google Apps Script web app as receiver. Fire-and-forget pattern (doesn't block user). Module: `server/googleSheets.ts`

- **B2B Enterprise Module**: Complete enterprise functionality for organizational back pain analysis
  - Company registration form at `/empresas`
  - Admin panel at `/admin` to manage companies and generate cost analyses
  - Executive dashboard at `/dashboard/:companyId` with cost breakdowns and risk distributions
  - Automatic cost calculation (absenteeism, presenteeism, future risk projection)
  - Invite code system to link employee assessments to companies

## Previous Changes (December 2025)

- **Bilingual Support**: Full Spanish/English internationalization implemented
- **Language Selector**: Toggle between ES/EN in header of all pages
- **Persistence**: Language preference saved in localStorage

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **Component Library**: shadcn/ui (Radix UI primitives with custom styling)
- **Build Tool**: Vite with HMR support
- **Internationalization**: LanguageContext with ES/EN support

The frontend follows a pages-based structure with reusable assessment components (pain scales, option cards, yes/no toggles, progress indicators). UI supports Spanish and English with instant language switching.

### Internationalization (i18n)
- **Context**: `client/src/contexts/LanguageContext.tsx` manages language state
- **Translations**: `client/src/lib/translations.ts` contains shared translation catalog
- **Language Selector**: `client/src/components/language-selector.tsx` dropdown component
- **Implementation**: Each page (home, assessment, results) has inline translation objects that respond to the language context
- **Persistence**: Language preference stored in localStorage with "es" default

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Build Process**: esbuild bundles server code, Vite builds client

Key routes:
- `POST /api/assessment` - Submit assessment and calculate risk score
- `GET /api/assessment/:id` - Retrieve assessment results
- `GET /api/assessments/by-email/:email` - Retrieve past reports by email

B2B Enterprise routes:
- `POST /api/companies` - Register new company (public form)
- `GET /api/companies/validate/:inviteCode` - Validate company invite code
- `GET /api/admin/companies` - List all companies (admin)
- `GET /api/admin/companies/:id` - Get company details with stats (admin)
- `PATCH /api/admin/companies/:id/status` - Update company status (admin)
- `POST /api/admin/companies/:id/cost-analysis` - Calculate and save cost analysis (admin)
- `GET /api/dashboard/:companyId` - Executive dashboard for company

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Current Storage**: In-memory storage (MemStorage class) - designed for easy PostgreSQL migration
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod

### Risk Calculation Logic
Located in `server/routes.ts`, the scoring algorithm adapts the STarT Back methodology:
- Pain factors (intensity, duration, leg pain): max 30 points
- Psychological factors (fear of movement, catastrophizing, depression): max 30 points
- Lifestyle factors (stress, sedentary hours, physical activity): remaining points
- Thresholds: Low (<25), Medium (25-50), High (>50)

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets/*` → `./attached_assets/*`

## External Dependencies

### Database
- PostgreSQL (configured via `DATABASE_URL` environment variable)
- Drizzle Kit for migrations (`npm run db:push`)

### UI Libraries
- Radix UI primitives (full suite: dialog, dropdown, tabs, etc.)
- Lucide React icons
- Embla Carousel
- React Day Picker for calendars
- Vaul for drawer components
- CMDK for command palette

### Fonts
- Google Fonts loaded via CDN: Inter, DM Sans, Geist Mono, Fira Code

### Development Tools
- Replit-specific plugins: runtime error overlay, cartographer, dev banner
- TypeScript with strict mode
- PostCSS with Tailwind and Autoprefixer