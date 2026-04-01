# Rent and Drive — Enterprise Car Rental Platform

**RentAndDrive LLC** | Reno, NV | Built with Next.js 16 + Supabase + Vercel

A production-grade, AI-powered peer-to-peer and direct car rental platform engineered to compete with and exceed Turo and Getaround. Contactless operations, delivery-to-door, zero-dispute AI inspections, and smarter fleet intelligence — all in one platform.

[Continue developing on v0](https://v0.app/chat/projects/prj_1Zat4tQSXCQxC4VE7E9ZBMOSDIgJ)

---

## Business Overview

Rent and Drive targets the Reno, NV market — a high-demand corridor between Reno-Tahoe International Airport (RNO), downtown Reno, and Lake Tahoe. We operate a hybrid model: hosts list personal vehicles (Turo-style) while RAD also operates a company-owned fleet under direct management.

**Key differentiators:**
- 90/10 host revenue split (vs. Turo's 65-80%)
- Contactless delivery via Uber Direct + Lyft Concierge
- RADar GPS fleet tracking (Bouncie OBD2) on every vehicle
- AI vehicle inspection on every trip (Inspektlabs) — zero disputes
- igloohome smart lockboxes for contactless key handoff
- RAD Rentability Score (Checkr MVR + Stripe Identity) — safer renters
- 10-agent AI suite: pricing, fleet health, renter comms, market intel, and more

---

## Tech Stack

```
Frontend         Next.js 16 (App Router) + React 19 + TypeScript
Styling          Tailwind CSS v4 + shadcn/ui + Radix UI
Auth             Supabase Auth (email/OAuth)
Database         Supabase PostgreSQL (Row Level Security)
Payments         Stripe (Checkout, Connect, Identity)
AI               Vercel AI SDK 6 + xAI Grok (primary) + OpenAI (fallback)
GPS Tracking     Bouncie OBD2 via RADar system
Smart Locks      igloohome API
Inspections      Inspektlabs AI damage detection
Background Check Checkr (MVR + identity)
Delivery         Uber Direct + Lyft Concierge (Lyft-first, Uber fallback)
Caching          Upstash Redis
SMS              Twilio
Email            SendGrid
Deployment       Vercel (auto-deploy on push to main)
```

---

## Integration Roadmap

| Integration       | Status        | Purpose                              |
|-------------------|---------------|--------------------------------------|
| Supabase          | Production    | Database, auth, storage              |
| Stripe            | Production    | Payments, deposits, host payouts     |
| Bouncie / RADar   | Production    | GPS tracking, geofencing, diagnostics|
| igloohome         | Production    | Smart lockbox PIN management         |
| Inspektlabs       | Production    | AI pre/post trip inspections         |
| Checkr            | Production    | Driver MVR + background screening    |
| Uber Direct       | Production    | Vehicle delivery by Uber couriers    |
| Lyft Concierge    | Production    | Vehicle delivery by Lyft drivers     |
| Twilio            | Production    | SMS notifications                    |
| SendGrid          | Production    | Transactional email                  |
| Upstash Redis     | Production    | Rate limiting, caching               |
| xAI / Grok        | Production    | Dynamic pricing, AI agents           |
| OpenAI            | Fallback      | AI agent fallback model              |

---

## Project Structure

```
/app                     Next.js App Router pages and API routes
  /api
    /eagle               Bouncie GPS webhook + telemetry endpoints
    /igloo               igloohome lockbox access management
    /inspect             Inspektlabs AI inspection sessions
    /concierge           Lyft/Uber ride scheduling for renters
    /mobility            Delivery orchestration dispatcher
    /agents              10 RAD AI agent endpoints
    /cron                Scheduled background jobs (Vercel Cron)
    /stripe              Payment processing and webhooks
/integrations            Clean client libraries for all third-party APIs
  bouncie.ts             GPS tracking, geofencing, diagnostics
  igloohome.ts           Smart lockbox PIN generation
  inspektlabs.ts         AI vehicle damage inspection
  stripe.ts              Payments, Identity, Connect
  checkr.ts              Driver background and MVR
  uber-direct.ts         Uber Direct delivery API
  lyft-concierge.ts      Lyft Concierge delivery API
  ai-router.ts           Multi-LLM router (Grok / OpenAI / Claude)
/lib
  /eagle                 RADar telemetry, alerts, bouncie lib
  /fleet                 Dynamic pricing engine, utilization logic
  /mobility              Delivery orchestration logic
  /verification          Checkr MVR parsing, score engine
  /supabase              Supabase server/client helpers
/modules
  /delivery              Delivery booking flow UI components
/components              Shared UI components (Navbar, layouts, etc.)
/docs
  /business-plan         BUSINESS-PLAN.md investor document
```

---

## One-Command Setup

```bash
# Clone and install
git clone https://github.com/jcald81-art/rentanddrive
cd rentanddrive
pnpm install

# Configure environment
cp .env.example .env.local
# Fill in your API keys — see .env.example for all required values

# Run locally
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

See `.env.example` for a complete list of all required and optional API keys. At minimum you need:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
- `AI_GATEWAY_API_KEY` or `XAI_API_KEY` for the AI agents

---

## Deployment

Every push to `main` auto-deploys to Vercel. The v0 head branch (`v0/jcald81-2501-9519c068`) is where active development happens — open a PR to merge into main.

---

## License

Proprietary — RentAndDrive LLC, Reno NV. All rights reserved.
