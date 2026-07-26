# WeWallet - Agent Instructions

## Project Overview
Personal utility web app: calculator, notes, shopping lists, reminders, finance tracking. Built with Next.js 16 + Supabase + Tailwind CSS 4.

## Commands
```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
```

No test suite exists. Verify changes with `npm run build`.

## Tech Stack Quirks

### Tailwind CSS v4
- Uses `@import "tailwindcss"` syntax (NOT `@tailwind base/components/utilities`)
- Config via `@theme {}` block in `globals.css`, NOT `tailwind.config.js`
- PostCSS plugin: `@tailwindcss/postcss` (not `tailwindcss` directly)

### Next.js 16
- App Router only (`src/app/`)
- Middleware file convention is deprecated (warning is expected, still works)
- Font loaded via `next/font/google` in `layout.tsx`
- All pages are client components (`"use client"`)

### Supabase
- Client: `src/lib/supabase/client.ts` (browser)
- Server: `src/lib/supabase/server.ts` (SSR, used in middleware)
- Auth: Supabase Auth with email/password
- RLS enabled on all tables
- Schema: `supabase-schema.sql` (run in Supabase SQL Editor)

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=       # From Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # From Supabase Dashboard → Settings → API
RESEND_API_KEY=                 # From resend.com/api-keys (for email recap)
```

## Directory Structure
```
src/
├── app/
│   ├── (auth)/          # Login, register, forgot-password, reset-password
│   ├── (dashboard)/     # Protected routes (dashboard, calculator, notes, etc.)
│   ├── api/send-recap/  # API route for email recap
│   └── layout.tsx       # Root layout with ToastProvider
├── components/
│   ├── ui/              # Button, Card, Input, Modal, Toast, ErrorBoundary
│   ├── dashboard/       # StatsCard, ModuleCard, ActivityFeed, QuickChart, etc.
│   ├── finance/         # FinanceCharts
│   ├── layout/          # Sidebar
│   └── auth/            # AuthCheck
├── lib/
│   ├── supabase/        # client.ts, server.ts
│   ├── validations/     # Zod schemas
│   ├── export/          # PDF (jsPDF) & Excel (xlsx) export
│   ├── recap/           # Email recap generation
│   └── utils.ts         # cn(), formatCurrency(), formatDate()
└── types/
    ├── database.ts      # TypeScript interfaces
    └── index.ts         # Re-exports
```

## Code Conventions

### UI Components
- Use `Modal` from `components/ui/modal.tsx` (handles focus trap, Escape, scroll lock)
- Use `useToast()` from `components/ui/toast.tsx` for notifications (success/error/info)
- Use Zod schemas from `lib/validations/` for form validation
- Button variants: `default` (pink), `outline`, `ghost`, `destructive`, `secondary`, `link`

### Auth Flow
- Middleware (`src/middleware.ts`) handles route protection
- Unauthenticated → `/login`; Authenticated on auth pages → `/dashboard`
- `AuthCheck` component provides client-side auth guard

### Color Scheme
- Primary: Pink (`#ec4899` / `pink-500`)
- Accent only, not dominant
- Text: `#111827` (gray-900), `#4b5563` (gray-600)
- Background: `#ffffff`, page bg: `#f9fafb` (gray-50)

### Writing Style
- Indonesian, casual tone (use "kamu" not "Anda")
- Avoid AI-sounding copy (no "Kelola keuangan Anda di sini")
- Keep labels short and functional

## Database Tables
- `profiles` - User info (auto-created via trigger)
- `notes` - Notes with categories, pinning
- `shopping_lists` / `shopping_list_items` - Shopping lists with items
- `reminders` - Reminders with repeat types
- `finance_records` - Income/expense transactions
- `calculator_history` - Calculator history (load from DB, not just save)

## Key Implementation Details
- Calculator history persists to Supabase (load on mount, save/delete individually)
- Dashboard trends use real month-over-month data (not simulated)
- Email recap sends via Resend API to user's registered email
- All modals use reusable `Modal` component with accessibility (focus trap, ARIA)
- All forms use Zod validation before submission
