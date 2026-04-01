# RentAndDrive LLC — Business Plan

**Confidential — For Investor Review**
Reno, Nevada | rentanddrive.com

---

## Executive Summary

RentAndDrive LLC is a technology-first peer-to-peer and direct car rental platform headquartered in Reno, Nevada. We are building the most operationally advanced car rental company in the Western United States — one that combines the marketplace model of Turo with the operational intelligence of a tech company.

### The Market Opportunity

Reno sits at the intersection of three high-demand travel corridors:

1. **Reno-Tahoe International Airport (RNO)** — 4+ million annual passengers, with traditional rental car desks commanding premium prices and limited inventory. Travelers landing at RNO increasingly prefer the price transparency and vehicle variety of peer-to-peer platforms.

2. **Lake Tahoe Tourism** — One of the most visited destinations in the US, drawing 15+ million visitors annually for skiing, hiking, and outdoor recreation. The majority of Tahoe visitors travel through Reno. Adventure vehicles (4WD, AWD trucks, SUVs) command 2-3x standard rental rates during ski season.

3. **Burning Man + Major Events** — Northern Nevada hosts Burning Man (70,000+ attendees), Hot August Nights, the National Bowling Stadium, and a growing convention calendar. These events create short-duration demand spikes where dynamic pricing generates outsized revenue.

### Why We Win

| Factor | Turo | Getaround | RentAndDrive |
|--------|------|-----------|--------------|
| Host revenue share | 65–80% | 60–70% | **90%** |
| GPS on every vehicle | No | Partial | **Yes (RADar)** |
| AI damage inspection | No | No | **Yes (Inspektlabs)** |
| Contactless delivery | No | No | **Yes (Uber/Lyft)** |
| Smart lockbox access | No | Limited | **Yes (igloohome)** |
| Driver screening | Basic | Basic | **Full MVR + identity** |
| AI dynamic pricing | No | No | **Yes (Grok-powered)** |
| Dispute resolution | Manual | Manual | **AI + photo evidence** |

---

## Business Model

### Revenue Streams

**1. Platform Fee (Primary)**
- Renters pay a 10% service fee on all bookings
- Hosts keep 90% of the daily rate they set
- Average booking value: $180–$240 (3-day trip)
- Platform revenue per booking: $18–$24

**2. Delivery Service Fee**
- $25–$75 per delivery depending on distance (airport, hotel, Tahoe)
- RAD coordinates via Uber Direct and Lyft Concierge
- ~40% of bookings are expected to use delivery after launch

**3. Protection Plans**
- Basic ($12/day), Standard ($18/day), Premium ($25/day)
- Underwritten by third-party insurance partner
- ~70% attachment rate at booking

**4. RAD Fleet (Company-Owned Vehicles)**
- RAD operates 10–20 vehicles directly in Year 1
- Higher margin: no host split on company-owned inventory
- Focused on high-demand categories: AWD SUVs, pickup trucks, luxury sedans

**5. Drive Monthly (Subscription)**
- Monthly subscription for frequent renters: $299–$499/mo for unlimited days
- Targeting remote workers, locals between car purchases, new Reno residents

---

## Technology Stack

The platform is built on a modern, scalable stack designed for rapid iteration and enterprise reliability:

- **Frontend:** Next.js 16 App Router with React 19, TypeScript, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Row Level Security + Auth)
- **AI Layer:** Vercel AI SDK with xAI Grok as primary model, OpenAI GPT as fallback
- **Payments:** Stripe Checkout, Connect (host payouts), Stripe Identity (renter verification)
- **Fleet Intelligence:** Bouncie OBD2 GPS devices (RADar) — real-time location, diagnostics, geofencing
- **Contactless Access:** igloohome smart lockboxes on every vehicle
- **AI Inspections:** Inspektlabs AI damage detection on every pre/post-trip walkthrough
- **Driver Screening:** Checkr MVR + background check, producing a RAD Rentability Score
- **Delivery:** Uber Direct API + Lyft Concierge API (Lyft-first with Uber fallback)
- **Deployment:** Vercel (global edge network, auto-deploys from GitHub)

### The RAD Agent Suite

Ten specialized AI agents operate 24/7 to manage the platform autonomously:

| Agent | Function |
|-------|----------|
| Dollar | Dynamic pricing optimization based on demand, events, utilization |
| Pulse | Fleet health monitoring — oil, battery, tire pressure, check engine |
| Shield | Fraud detection, chargeback prevention, renter risk scoring |
| Concierge | Renter communication, booking support, delivery coordination |
| Diesel | Fuel cost analysis and mileage optimization |
| Market Intel | Competitor pricing monitoring (Turo, Getaround, traditional rental) |
| FunTime | Seasonal demand forecasting — ski season, summer tourism, events |
| Reviews | Guest review monitoring and automated host response drafting |
| SecureLink | Smart lockbox and key access management automation |
| CommandControl | Cross-agent orchestration and escalation to human operators |

---

## Go-To-Market Strategy

### Phase 1: Reno Launch (Months 1–6)
- Launch with 20–30 host vehicles + 10 RAD-owned vehicles
- Focus: RNO airport pickups and Tahoe corridor deliveries
- Acquire first 500 renters through targeted digital advertising (Google, Meta, TikTok)
- Establish partnerships with Reno hotels and resorts for in-lobby booking kiosks

### Phase 2: Market Expansion (Months 7–18)
- Expand to Las Vegas, Sacramento, and San Francisco Bay Area
- Grow fleet to 200+ vehicles across all markets
- Launch Drive Monthly subscription nationally
- Pursue Series A fundraising ($3–5M) for fleet acquisition and market expansion

### Phase 3: Platform Licensing (Year 2+)
- License the RAD platform to regional rental operators in other cities
- White-label the technology for hotel chains and airports
- Explore international expansion (Mexico, Canada)

---

## Financial Projections

### Year 1 (Reno Market)

| Metric | Target |
|--------|--------|
| Active vehicles | 50 |
| Monthly bookings | 400 |
| Average booking value | $200 |
| Monthly gross booking value | $80,000 |
| Monthly platform revenue (10%) | $8,000 |
| Monthly delivery revenue | $4,000 |
| Monthly protection plan revenue | $6,000 |
| **Monthly total revenue** | **$18,000** |
| **Annual revenue run rate (Month 12)** | **$216,000+** |

### Year 2 (Multi-Market)

| Metric | Target |
|--------|--------|
| Active vehicles | 300 |
| Monthly bookings | 3,000 |
| **Annual revenue** | **$2.1M+** |

---

## Team

**Joseph Caldwell — Founder & CEO**
Reno-based entrepreneur with deep knowledge of the Northern Nevada market, automotive sector, and technology. Building RentAndDrive as a lean, AI-first operation from day one.

---

## Investment Ask

RentAndDrive is raising a **$500,000 pre-seed round** to fund:
- Fleet acquisition (10 RAD-owned vehicles): $250,000
- Platform launch + marketing: $150,000
- Operations (insurance, igloohome devices, Bouncie units): $75,000
- Working capital: $25,000

**Contact:** joe@rentanddrive.com | (775) 555-RENT

---

*This document contains forward-looking statements and financial projections. Actual results may differ materially. Confidential — do not distribute.*
