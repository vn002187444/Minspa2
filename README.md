# Min Nail & Hair — Salon Management System

Hệ thống quản lý tiệm nail & tóc với AI-powered booking, CRM, SEO, và multi-language support.

## Stack

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | ^16.2.9 | Framework (App Router) |
| React | ^19.2.7 | UI |
| Supabase | PostgreSQL | Database + Realtime |
| Tailwind CSS | ^4.4.1 | Styling |
| TypeScript | ^5 | Language |
| Sentry | — | Error tracking |
| Zod | — | Input validation |
| web-push | ^3.6.7 | Push notifications |
| @google/genai | ^2.7.0 | Gemini AI integration |

## Features

- **Booking System** — AI-powered scheduling with 6-step validation
- **Customer CRM** — Customer profiles, history, feedback
- **Staff Portal** — Attendance, schedule, commission tracking
- **SEO Manager** — AI-generated content, blog, meta tags
- **Multi-language** — 9 languages (EN, VI, KO, ZH, TH, ID, JA, MS, KM)
- **Push Notifications** — Realtime alerts + web push
- **Analytics** — Dashboard, revenue reports, staff performance
- **Salary Management** — Commission calculation, payment tracking

## Project Structure

```
minspa/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard, schedule, customers, blog, orders, settings
│   ├── api/                # API routes (cron jobs, auth, health, SEO)
│   ├── booking/            # Customer booking flow (3 steps)
│   ├── blog/               # Public blog pages
│   ├── login/              # Authentication
│   └── staff/              # Staff portal
├── components/             # Reusable UI components
│   └── ui/                 # Design system (Button, Input, Card)
├── lib/                    # Core utilities
│   ├── booking-engine.ts   # Time slot management, locking
│   ├── logger.ts           # Sentry-integrated logging
│   ├── i18n/               # Internationalization (9 languages)
│   └── supabase/           # Database client helpers
├── utils/                  # Business logic
│   ├── notifications.ts    # Notification CRUD
│   ├── push.ts             # Web push
│   └── reminders.ts        # Reminder rules
├── hooks/                  # React hooks
└── database.sql            # Database schema (37 tables)
```

## Database Schema

37 tables including:
- `users`, `customers`, `appointments`, `services`
- `time_slot_locks`, `attendance`, `salary_payments`
- `treatment_packages`, `customer_packages`, `package_usage_logs`
- `blogs`, `seo_settings`, `seo_articles`
- `notifications`, `background_tasks`, `tasks`
- `faqs`, `service_categories`

11 RPC functions for complex operations (deduct/refund sessions, queue tasks).

## Setup

### Prerequisites
- Node.js 18+
- Supabase project (PostgreSQL)
- Sentry project (optional)

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-min-32-chars

# Optional
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public
VAPID_PRIVATE_KEY=your-vapid-private
CRON_SECRET=your-cron-secret
```

### Install & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Build Commands

```bash
npm run dev          # Development (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript check
```

## Authentication

Custom JWT session cookie (not Supabase Auth):
- `httpOnly: true`, `secure: true`, `sameSite: 'strict'`
- 24-hour access + 7-day refresh (sliding session)
- Roles: `ADMIN`, `MANAGER`, `STAFF`

## Error Tracking

- `lib/logger.ts` — Sentry integration (production)
- All server actions use `logger.error()` (not `console.error`)
- All `.catch()` blocks log errors (no silent failures)
- Cron routes authenticated via `CRON_SECRET`

## Cron Jobs

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cron/reminders` | GET | 4 reminder rules (attendance, booking, unaccepted, uncompleted) |
| `/api/cron/marketing` | GET | Marketing auto-posts |
| `/api/cron/auto-assign` | GET | Auto-assign staff to bookings |
| `/api/cron/seo-publish` | GET | SEO article publishing |

## Deployment

Recommended: Vercel
- Automatic deployments on push to `main`
- Environment variables in Vercel dashboard
- Sentry integration for error monitoring

## License

Private — Min Nail & Hair
