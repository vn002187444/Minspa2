# Mind Map: Min Nail & Hair Architecture

```
                     ┌─────────────────────────────────────┐
                     │         MIN NAIL & HAIR SPA         │
                     │       Next.js 16 + Supabase PG      │
                     └─────────────────────────────────────┘
                                       │
         ┌─────────────┬───────────────┼───────────────┬──────────────┐
         │             │               │               │              │
    ┌────┴────┐   ┌────┴────┐    ┌────┴────┐    ┌────┴────┐   ┌────┴────┐
    │ PUBLIC   │   │ ADMIN    │    │ STAFF    │    │ API      │   │ DATABASE │
    │ PAGES    │   │ PAGES    │    │ PAGES    │    │ ROUTES   │   │ (34 tbl) │
    └────┬────┘   └────┬────┘    └────┬────┘    └────┬────┘   └────┬────┘
         │             │               │               │              │
    ┌────┴────┐   ┌────┴────┐    ┌────┴────┐    ┌────┴────┐   ┌────┴────┐
    │ /       │   │ /admin  │    │ /staff  │    │ Auth     │   │ users   │
    │ /booking│   │ /schedule│   │ check-in│    │ /login   │   │ customers│
    │ /blog   │   │ /blog   │    │ schedule│    │ /logout  │   │ appts   │
    │ /blog/[x]│   │ /seo-   │    │ package │    │ /me      │   │ services │
    │ /login  │   │ articles│    │ deduct   │    ├──────────┤   │ blogs   │
    └─────────┘   │ /customers│   └─────────┘    │ AI       │   │ packages │
                  │ /orders  │                   │ /ai-assist│   │ reviews  │
                  │ /audit   │                   │ /generate-│   │ seo_     │
                  │ /blog-   │                   │  seo-     │   │ articles │
                  │ analytics│                   │  article  │   │ seo_     │
                  └──────────┘                   │ /generate-│   │ settings │
                                                 │  seo-image│   │ notifs   │
                                                 ├──────────┤   │ audit_   │
                                                 │ Cron     │   │ logs     │
                                                 │ /reminders│   │ rate_    │
                                                 │ /marketing│   │ limits   │
                                                 │ /auto-    │   │ ai_cache │
                                                 │  assign   │   └──────────┘
                                                 └──────────┘
```

## Key Architecture Decisions

```
Custom Auth (JWT cookie)
    └── NOT using Supabase Auth
    └── Override auth.getUser in createClient()
    └── proxy.ts decrypts + re-encrypts every request (sliding session)

Booking Engine (lib/booking-engine.ts)
    └── Time slots with dynamic duration
    └── Cascade shift on early completion
    └── Offline queue via IndexedDB

SEO Schema Components
    └── All server components (no 'use client')
    └── JSON-LD via dangerouslySetInnerHTML
    └── 8 schemas: WebSite, BreadcrumbList, Article, Service, Product,
        AggregateRating, FAQ, LocalBusiness

AI Integration (Gemini)
    └── gemini-3.1-flash-lite (text, googleSearch tool)
    └── gemini-2.5-flash-image (image generation)
    └── No responseMimeType with googleSearch (API conflict)
    └── ai_cache table for response caching

Image Pipeline
    └── Upload: Base64 → sharp (1200px, WebP q80) → Supabase Storage
    └── SEO: image_alt column in blogs/services/seo_articles
    └── OG: PNG format (not SVG — social platforms don't render SVG)

Notification System
    └── Database table (notifications) → Supabase Realtime channel
    └── Push: web-push (VAPID) → Service Worker
    └── Cron: 4 reminder rules + marketing auto-posts
```

## Component Hierarchy

```
layout.tsx
├── WebSiteSchema (JSON-LD)
├── AggregateRatingSchema (JSON-LD)
├── GoogleTranslate (globe button + lang dropdown)
├── HeaderNav (logo, nav links)
│   └── logo_url từ seo_settings (customizable via TabSettings)
├── Page content
│   ├── BreadcrumbNav (UI, optional per page)
│   ├── BreadcrumbSchema (JSON-LD, optional per page)
│   └── [...page-specific schemas...]
└── Footer (logo, contact, social links)
```

## Route Groups

```
app/
├── (public)/        → Landing, blog, booking, login
│   ├── page.tsx     → Home (landing page)
│   ├── booking/     → 3-step booking flow
│   └── blog/        → Blog list + detail
├── (auth)/          → Admin + Staff (requires session)
│   ├── admin/       → Dashboard, schedule, blog, seo-articles, customers, orders
│   └── staff/       → Check-in, schedule, package deduction
└── api/             → Auth, AI, Cron, Notifications, Blog
```

## Data Flow for Key Operations

```
Booking:
  Client → getSlotAvailability() → server → query appointments + locks + staff
         → return availability grid (MemoizedMap per date)
         → click slot → getAvailableStaff() → staff list
         → submitBooking() → lockTimeSlots() → insert appointment → notifications

Blog/SEO:
  Admin → writeArticle (AI) → save draft
        → suggestImages (AI + googleSearch) → get image URLs + alt texts
        → publish → sitemap updated → breadcrumb + article schema rendered

Staff Check-in:
  Staff → /staff portal → checkAttendance() → insert/update attendance
        → view day schedule → select appointment → update status
        → deduct package (if applicable) → unlockTimeSlots + cascadeShift
```
