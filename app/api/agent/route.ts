import Anthropic from "@anthropic-ai/sdk"
import { NextRequest } from "next/server"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const RAD_SYSTEM_PROMPT = `You are RAD, the AI concierge 
for Rent and Drive (rentanddrive.net) — a peer-to-peer car 
rental platform serving Reno, Sparks, and Lake Tahoe, Nevada.

You help renters find and book vehicles, help hosts list and 
manage their fleet, and answer any questions about the platform.

Keep responses concise — 2 to 4 sentences maximum unless 
the user asks for detail. Be direct and helpful. 
Never make up pricing, availability, or policies you don't know.

IMPORTANT: Never use markdown formatting. No bold (**), no 
italics (*), no headers (#), no code blocks (\`). Plain text only. 
Use numbers and line breaks for lists.

Key facts:
- RAD takes 10% commission vs Turo's 25-35%
- All vehicles have Bouncie GPS tracking (RADar)
- CarFidelity inspection system verifies all vehicles
- Markets: Reno, Sparks, Lake Tahoe only
- Keyless access via igloohome on all vehicles
- Support: help@rentanddrive.net`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== "string") {
      return Response.json(
        { response: "Please send a message." },
        { status: 200 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[/api/agent] ANTHROPIC_API_KEY missing")
      return Response.json(
        { response: "RAD is temporarily unavailable. Email help@rentanddrive.net." },
        { status: 200 }
      )
    }

    const messages = [
      ...conversationHistory
        .filter((m: { role: string; content: string }) =>
          m.role === "user" || m.role === "assistant"
        )
        .slice(-10), // keep last 10 messages for context
      { role: "user" as const, content: message },
    ]

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: RAD_SYSTEM_PROMPT,
      messages,
    })

    const text =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "RAD is unavailable right now."

    return Response.json({ response: text }, { status: 200 })

  } catch (error) {
    console.error("[/api/agent] Error:", error)
    return Response.json(
      { response: "RAD is temporarily unavailable. Email help@rentanddrive.net." },
      { status: 200 } // always 200 so client never throws
    )
  }
}
