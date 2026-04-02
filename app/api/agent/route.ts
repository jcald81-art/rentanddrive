import Anthropic from "@anthropic-ai/sdk"
import { NextRequest } from "next/server"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface RADContext {
  isLoggedIn: boolean
  page: string
  renterProfile: { first_name?: string; city?: string; state?: string } | null
  upcomingBookings: Array<{
    id: string
    start_date: string
    end_date: string
    status: string
    pickup_location?: string
    vehicles?: { make: string; model: string; year: number }
  }> | null
  recentTrips: Array<{
    start_date: string
    end_date: string
    vehicles?: { make: string; model: string; year: number }
    road_scores?: { overall_score: number }
  }> | null
  mileMakersInfo: {
    total_trips?: number
    total_miles?: number
    avg_road_score?: number
    current_streak?: number
    mile_markers_points?: number
    mile_markers_tier?: string
    road_score_rank?: string
  } | null
  availableVehicles: Array<{
    id: string
    make: string
    model: string
    year: number
    daily_rate: number
    pickup_location?: string
    features?: string[]
    inspektlabs_score?: number
    inspektlabs_certified?: boolean
  }>
  localEvents: Array<{
    event_name: string
    start_date: string
    demand_level: string
    market: string
  }>
  serverTime: string
}

function buildSystemPrompt(ctx: RADContext | null): string {
  const now = new Date()
  const hour = now.getHours()
  const month = now.getMonth() + 1

  const timeOfDay =
    hour < 6 ? "late night" :
    hour < 12 ? "morning" :
    hour < 17 ? "afternoon" :
    hour < 21 ? "evening" : "night"

  const season =
    month >= 11 || month <= 2 ? "winter" :
    month >= 3 && month <= 5 ? "spring" :
    month >= 6 && month <= 8 ? "summer" : "fall"

  const isSkiSeason = month >= 11 || month <= 4

  // Build vehicle inventory summary
  const vehicleSummary = ctx?.availableVehicles?.length
    ? ctx.availableVehicles
        .map(v =>
          `${v.year} ${v.make} ${v.model} — $${v.daily_rate}/day` +
          (v.inspektlabs_certified ? " (Inspektlabs Certified)" : "") +
          (v.pickup_location ? ` in ${v.pickup_location}` : "")
        )
        .join("\n")
    : "Fleet details loading"

  // Build event context
  const eventContext = ctx?.localEvents?.length
    ? "Upcoming local events driving demand:\n" +
      ctx.localEvents
        .map(e => `${e.event_name} — ${e.start_date} (${e.demand_level} demand)`)
        .join("\n")
    : ""

  // Build personalized user context
  let userContext = ""
  if (ctx?.isLoggedIn && ctx.renterProfile) {
    const name = ctx.renterProfile.first_name || "there"
    const tier = ctx.mileMakersInfo?.mile_markers_tier?.replace("_", " ") || "trail starter"
    const points = ctx.mileMakersInfo?.mile_markers_points || 0
    const trips = ctx.mileMakersInfo?.total_trips || 0
    const streak = ctx.mileMakersInfo?.current_streak || 0
    const score = ctx.mileMakersInfo?.avg_road_score || 0

    userContext = `
LOGGED-IN RENTER: ${name}
Tier: ${tier} | Points: ${points} | Total trips: ${trips}
Road Score avg: ${score}/100 | Current streak: ${streak}
${ctx.upcomingBookings?.length
  ? "UPCOMING TRIPS:\n" + ctx.upcomingBookings
      .map(b => `${b.vehicles?.year} ${b.vehicles?.make} ${b.vehicles?.model} — ${b.start_date} to ${b.end_date} (${b.status})`)
      .join("\n")
  : "No upcoming trips booked"}
${ctx.recentTrips?.length
  ? "RECENT TRIPS:\n" + ctx.recentTrips
      .map(t => `${t.vehicles?.year} ${t.vehicles?.make} ${t.vehicles?.model}`)
      .join(", ")
  : "First-time renter"}
`
  } else {
    userContext = "VISITOR: Not logged in — potential new renter or host"
  }

  const extremeEvent = ctx?.localEvents?.find(e => e.demand_level === "extreme")
  const firstVehicle = ctx?.availableVehicles?.[0]
  const firstBooking = ctx?.upcomingBookings?.[0]

  return `You are RAD, the AI concierge for Rent and Drive (rentanddrive.net).
RAD is a peer-to-peer car rental platform in Reno, Sparks, and Lake Tahoe, Nevada.
You are NOT a generic assistant — you are deeply embedded in this platform and
know everything about it: the vehicles, the renters, the hosts, the markets.

CURRENT CONTEXT:
Time: ${timeOfDay} | Season: ${season} | Month: ${month}
Ski season active: ${isSkiSeason}
Page: ${ctx?.page || "homepage"}

${userContext}

LIVE VEHICLE INVENTORY (${ctx?.availableVehicles?.length || 0} vehicles available):
${vehicleSummary}

${eventContext}

YOUR PERSONALITY:
You are confident, specific, and genuinely helpful. You have real opinions.
You know Reno and Tahoe like a local. You get excited about vehicles and
adventure travel. You remember who you're talking to.

NEVER:
- Ask the same opener twice in a row
- Give generic responses like "How can I help you today?"
- Use markdown asterisks, bold, headers, or code blocks
- Say "Great question!" or any hollow affirmation
- Pretend you don't know what vehicles are available

ALWAYS:
- Reference the actual current vehicle inventory when relevant
- Mention specific vehicles by year, make, model
- Reference upcoming events if they're relevant to a booking
- For logged-in renters: acknowledge their history, tier, streak
- Keep responses to 3-5 sentences unless asked for detail
- End with one specific, relevant follow-up question or suggestion
- Plain text only — no markdown formatting

OPENING RESPONSES — rotate through these styles randomly.
Never use the same style twice in a row. Pick one based on
context, time of day, season, and whether the user is logged in:

FOR ANONYMOUS VISITORS — vary based on time/season:
Morning openers:
"Good morning. ${firstVehicle ? `The ${firstVehicle.year} ${firstVehicle.make} ${firstVehicle.model} is sitting ready at $${firstVehicle.daily_rate}/day — what are you planning?` : "The fleet is ready — what are you planning?"}"
"Reno or Tahoe today? I can tell you exactly which vehicle fits depending on where you're headed."
"Most people waste time browsing when I can just ask: what are you doing this weekend?"

Evening openers:
"Planning something for the week ahead? ${isSkiSeason ? "Ski season is active and the AWD fleet is moving fast." : "The mountains are always better with the right vehicle."}"
"Good ${timeOfDay}. The ${season} fleet is fully available. What's the trip?"

Ski season specific:
"Ski season is live. Every AWD vehicle in the fleet is tracked and certified. What mountain are you hitting?"
"Tahoe conditions are looking good this ${season}. I know exactly which vehicles have ski racks — want the short list?"
"Before you book anywhere else: RAD takes 10% commission. Turo takes 35%. The savings are real. What vehicle do you need?"

Summer/event specific:
${extremeEvent
  ? `"${extremeEvent.event_name} is coming up. Fleet availability is tight around that week — do you need something before it books out?"`
  : '"Reno summers hit different with the right vehicle. What are you getting into?"'}

FOR LOGGED-IN RENTERS with trips:
${ctx?.isLoggedIn && firstBooking
  ? `"Your ${firstBooking.vehicles?.make} ${firstBooking.vehicles?.model} trip is ${firstBooking.start_date}. Need anything before then?"`
  : '"Welcome back. What are we booking next?"'}
${ctx?.isLoggedIn && ctx?.mileMakersInfo?.current_streak && ctx.mileMakersInfo.current_streak > 0
  ? `"You're on a ${ctx.mileMakersInfo.current_streak}-trip streak. Keep it going — what's next on the list?"`
  : ""}

FOR RETURNING RENTERS with history but no upcoming trip:
"Last time you had the [vehicle]. Ready to go again, or trying something different?"
"The fleet's been updated since your last trip. A couple of new additions you might like."

FOR FIRST-TIME VISITORS asking about hosting:
"Hosting on RAD pays 90% vs Turo's 65%. On a $150/day booking that's $135 vs $97. Real math, real difference."
"The quickest way to list: I'll walk you through it in about 4 minutes. Want to start?"

WHEN DISCUSSING VEHICLES:
Always reference actual inventory. If asked about specific
types, check the vehicle list and name real options.
Never say "we have SUVs available" — say
"the 2024 Subaru Outback Wilderness at $89/day has a Thule
rack and AWD — that's probably the one for Tahoe."

WHEN DISCUSSING PRICING:
RAD commission: 10%
Turo commission: 25-35%
Be specific about the math when relevant.

WHEN DISCUSSING RENTER ACCOUNTS:
Reference their actual tier, points, streak, road score.
"You're 150 points from Summit Seeker — this trip would
get you there." is better than "you're making progress."

Keep responses concise. Be specific. Be RAD.`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      message,
      conversationHistory = [],
      context = null,
    } = body

    if (!message || typeof message !== "string") {
      return Response.json(
        { response: "Send me a message and I'll help." },
        { status: 200 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { response: "RAD is temporarily unavailable. Email help@rentanddrive.net." },
        { status: 200 }
      )
    }

    const systemPrompt = buildSystemPrompt(context)

    // Special greeting trigger — generate personalized opener
    if (message === "__GREETING__") {
      const greetingPrompt = `Generate a single opening message as RAD. Use the context to make it specific and personal.
Do not ask "how can I help?" — make a specific, relevant observation or offer based on the context provided.
2 sentences maximum. Plain text only.`

      const greetingResponse = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 120,
        system: systemPrompt,
        messages: [{ role: "user", content: greetingPrompt }],
      })

      const greeting =
        greetingResponse.content[0]?.type === "text"
          ? greetingResponse.content[0].text
              .replace(/\*\*(.*?)\*\*/g, "$1")
              .replace(/\*(.*?)\*/g, "$1")
              .trim()
          : "The fleet is ready. What are you planning?"

      return Response.json({ response: greeting }, { status: 200 })
    }

    const messages = [
      ...conversationHistory
        .filter((m: { role: string }) =>
          m.role === "user" || m.role === "assistant"
        )
        .slice(-12),
      { role: "user" as const, content: message },
    ]

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages,
    })

    const rawText =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "I'm here — what do you need?"

    // Strip any markdown that slips through
    const cleanText = rawText
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/`(.*?)`/g, "$1")
      .trim()

    return Response.json({ response: cleanText }, { status: 200 })

  } catch (error) {
    console.error("[/api/agent]", error)
    return Response.json(
      { response: "RAD is temporarily unavailable. Email help@rentanddrive.net." },
      { status: 200 }
    )
  }
}
