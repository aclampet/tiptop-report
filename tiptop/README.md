# TipTop.report

> Your reputation travels with you.

A portable professional reputation platform for service workers. Workers get a QR code, customers scan it to leave a review, and that review follows the worker forever — through every job change.

## Stack

- **Next.js 14** (App Router) — Frontend + API routes
- **Supabase** — PostgreSQL + Auth + Storage + Row Level Security
- **Tailwind CSS** — Styling (DM Serif Display + DM Sans fonts)
- **Vercel** — Hosting + CI/CD
- **Resend** — Transactional email
- **qrcode.react** — QR code generation

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/tiptop-service.git
cd tiptop-service
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and keys

### 3. Set environment variables

```bash
cp .env.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
tiptop/
├── app/
│   ├── page.tsx                    # Marketing homepage
│   ├── layout.tsx                  # Root layout
│   ├── auth/
│   │   ├── login/page.tsx         # Login
│   │   └── signup/page.tsx        # 2-step signup
│   ├── worker/[slug]/page.tsx     # Public worker profile
│   ├── review/[tokenId]/page.tsx  # Customer review form (no login)
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard sidebar
│   │   ├── page.tsx               # Overview
│   │   ├── reviews/page.tsx       # Review history
│   │   ├── qr/page.tsx           # QR code manager
│   │   └── badges/page.tsx       # Badge collection
│   └── api/
│       ├── workers/route.ts       # Worker CRUD
│       ├── reviews/route.ts       # Review submission + anti-fraud
│       ├── qr-tokens/route.ts     # QR token management
│       └── qr-tokens/[tokenId]/worker/route.ts
├── components/
│   ├── dashboard/
│   │   └── LogoutButton.tsx
│   └── qr/
│       └── QRCodeManager.tsx      # QR display + download
├── lib/
│   ├── utils.ts                   # Helpers, fingerprinting
│   ├── badges.ts                  # Badge award logic
│   └── email.ts                   # Email templates
├── supabase/
│   ├── client.ts                  # Browser Supabase client
│   ├── server.ts                  # Server Supabase clients
│   ├── middleware.ts              # Session refresh
│   └── migrations/
│       └── 001_initial_schema.sql # Full schema + RLS + seed
├── types/index.ts                 # All TypeScript types
└── middleware.ts                  # Route protection
```

## Key URLs

| Route | Description |
|-------|-------------|
| `/` | Marketing homepage |
| `/signup` | Worker registration (2-step) |
| `/login` | Authentication |
| `/worker/[slug]` | Public worker profile (SEO-optimized) |
| `/review/[tokenId]` | Customer review form (no login needed) |
| `/dashboard` | Worker overview |
| `/dashboard/qr` | QR code management + download |
| `/dashboard/reviews` | Review history + breakdown |
| `/dashboard/badges` | Badge collection |

## Security

- Row Level Security on every table
- Reviews are **immutable** (no update/delete policies)
- Server-side timestamps prevent backdating
- Device fingerprinting limits reviews to 1 per device per worker per 24h
- Service role key never exposed to client

## Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set env vars in Vercel dashboard or:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

## Phase 2 Roadmap

- [ ] Professional development courses
- [ ] Company accounts + team dashboards
- [ ] Worker search / talent directory
- [ ] Review response feature
- [ ] Stripe billing for employer plans
- [ ] Push notifications (PWA)

---

Built by AVDV VisExperts LLC
