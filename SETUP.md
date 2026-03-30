# Rent and Drive LLC - Platform Setup Guide

Complete setup guide for the Rent and Drive peer-to-peer car rental platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Integration Setup](#integration-setup)
5. [Running Locally](#running-locally)
6. [Deployment](#deployment)
7. [Cron Jobs](#cron-jobs)
8. [Testing](#testing)

---

## Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account (required)
- Vercel account (for deployment)

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Required - Core Platform

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Payments - Stripe

```bash
# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Communications - Twilio & SendGrid

```bash
# Twilio SMS (SecureLink agent)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid Email (SecureLink agent)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@rentanddrive.net
```

### Fleet Tracking - Bouncie GPS

```bash
# Bouncie (Eagle system)
BOUNCIE_API_KEY=your_bouncie_api_key
BOUNCIE_CLIENT_ID=your_client_id
BOUNCIE_CLIENT_SECRET=your_client_secret
BOUNCIE_WEBHOOK_SECRET=your_webhook_secret
```

### Lockbox - igloohome

```bash
# igloohome (Keyless entry)
IGLOO_API_KEY=your_igloo_api_key
IGLOO_CLIENT_ID=your_client_id
IGLOO_CLIENT_SECRET=your_client_secret
```

### Insurance - Tint

```bash
# Tint Insurance
TINT_API_KEY=your_tint_api_key
TINT_PARTNER_ID=your_partner_id
```

### VIN Check - CarFax

```bash
# CarFax VIN Reports
CARFAX_API_KEY=your_carfax_api_key
CARFAX_PARTNER_ID=your_partner_id
```

### AI Providers

```bash
# OpenAI (Concierge, Shield, Dollar agents)
OPENAI_API_KEY=sk-...

# Anthropic Claude (Morning briefs)
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity (Command&Control market research)
PERPLEXITY_API_KEY=pplx-...

# Groq (Fast inference)
GROQ_API_KEY=gsk_...

# Google Gemini
GEMINI_API_KEY=...

# DeepSeek
DEEPSEEK_API_KEY=...

# Grok (xAI)
GROK_API_KEY=xai-...

# NVIDIA
NVIDIA_API_KEY=nvapi-...
```

### Ride Services (Optional)

```bash
# Lyft Concierge
LYFT_CLIENT_ID=your_lyft_client_id
LYFT_CLIENT_SECRET=your_lyft_client_secret

# Uber
UBER_CLIENT_ID=your_uber_client_id
UBER_CLIENT_SECRET=your_uber_client_secret
```

### Cron Security

```bash
# Cron job authentication
CRON_SECRET=your_secure_random_string
```

### Admin

```bash
# Admin notification phone/email
ADMIN_PHONE=+1234567890
ADMIN_EMAIL=admin@rentanddrive.net
```

---

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the project URL and keys to your `.env.local`

### 2. Run Migrations

The migrations are in `/supabase/migrations/`. Run them in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor, run each file in order:
# 001_extensions.sql
# 002_core_tables.sql
# 003_agent_tables.sql
# 004_fleet_tables.sql
# 005_insurance_tables.sql
# 006_platform_tables.sql
# 007_hostslab_tables.sql
# 008_rr_tables.sql
# 009_rls_policies.sql
# 010_seeds.sql
# 011_community_tables.sql
```

### 3. Enable Row Level Security

RLS policies are included in `009_rls_policies.sql`. Verify they are active in Supabase Dashboard > Authentication > Policies.

---

## Integration Setup

### Stripe

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard > Developers > API keys
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Subscribe to events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

### Bouncie GPS (Eagle System)

1. Create Bouncie developer account at [bouncie.com](https://bouncie.com)
2. Register your application to get API credentials
3. Set webhook URL: `https://yourdomain.com/api/eagle/webhook`
4. Configure webhook events: trip_start, trip_end, geofence, hard_brake, speed, crash

### igloohome (Lockbox)

1. Apply for API access at [igloohome.co](https://igloohome.co)
2. Register lockboxes in their dashboard
3. Configure callback URL for access logs

### Twilio SMS

1. Create Twilio account at [twilio.com](https://twilio.com)
2. Get a phone number with SMS capability
3. Note the Account SID and Auth Token

### SendGrid Email

1. Create SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Verify your sender domain
3. Create an API key with Mail Send permissions

### Tint Insurance

1. Apply for partner access at [tint.ai](https://tint.ai)
2. Complete integration onboarding
3. Configure webhook for claim updates

---

## Running Locally

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Check Service Status

On startup, the console will show which services are live vs mock:

```
========================================
  RENT AND DRIVE - SERVICE STATUS
========================================

✓ LIVE SERVICES:
  SUPABASE: live
  STRIPE: live

⚠ MOCK MODE (optional):
  BOUNCIE: mock
  IGLOO: mock
  TINT: mock
```

Services in mock mode will use simulated responses. The platform never crashes on missing optional keys.

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

### Configure Cron Jobs in Vercel

Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/securelink", "schedule": "0 * * * *" },
    { "path": "/api/cron/dollar", "schedule": "0 2 * * *" },
    { "path": "/api/cron/shield", "schedule": "0 6 * * *" },
    { "path": "/api/cron/commandcontrol", "schedule": "0 6 * * 0" },
    { "path": "/api/cron/pulse", "schedule": "0 6 * * *" },
    { "path": "/api/cron/funtime", "schedule": "0 0 * * *" },
    { "path": "/api/cron/morning-brief", "schedule": "30 5 * * *" },
    { "path": "/api/cron/fleet-health", "schedule": "0 0 * * 0" }
  ]
}
```

---

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| SecureLink | Hourly | Send booking reminders, review requests |
| Dollar | Daily 2am | Optimize vehicle pricing |
| Shield | Daily 6am | Analyze reviews, calculate renter scores |
| Command&Control | Sunday 6am | Market research, competitor analysis |
| Pulse | Daily 6am | Fleet health checks, maintenance alerts |
| Funtime | Daily midnight | XP awards, badge checks, leaderboard |
| Morning Brief | Daily 5:30am | Generate personalized host briefs |
| Fleet Health | Weekly Sunday | NHTSA recall checks |

All cron endpoints require `Authorization: Bearer {CRON_SECRET}` header.

---

## Testing

### Test Stripe Webhooks

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test SecureLink SMS

```bash
curl -X POST http://localhost:3000/api/agents/securelink \
  -H "Content-Type: application/json" \
  -d '{"action": "test_sms", "recipientPhone": "+1234567890"}'
```

### Test Eagle Webhook

```bash
curl -X POST http://localhost:3000/api/eagle/webhook \
  -H "Content-Type: application/json" \
  -H "X-Bouncie-Signature: test" \
  -d '{"eventType": "trip_start", "imei": "test123"}'
```

### Verify Sitemap

Visit: `http://localhost:3000/sitemap.xml`

### Verify Robots.txt

Visit: `http://localhost:3000/robots.txt`

---

## Architecture Overview

### R&D Agent System

- **SecureLink**: All communications (SMS, email, notifications)
- **Dollar**: Dynamic pricing AI
- **Shield**: Reputation management, review analysis
- **Command&Control**: Market intelligence
- **Pulse**: Fleet health monitoring
- **Funtime**: Gamification engine

### Eagle Fleet System

- Real-time GPS tracking via Bouncie
- Geofence management for bookings
- Speed and boundary alerts
- Driving score calculation

### HostsLab

Host command center with 12 rooms:
- Lobby, Workshop, Eagle Command, R&D Navigator
- Briefing Room, Vault, Filing Cabinet
- Game Room, Break Room, Academy, Lab Controls

### Renter's Road

Renter gamification with badges, scores, photo contests, and rewards.

---

## Support

- Documentation: This file
- Issues: GitHub Issues
- Email: support@rentanddrive.net

---

## License

Proprietary - Rent and Drive LLC 2026
