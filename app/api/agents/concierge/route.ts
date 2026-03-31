import {
  convertToModelMessages,
  streamText,
  UIMessage,
  tool,
} from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { PERSONAS, type AIPersona } from '@/lib/ai-personas'

export const maxDuration = 30

// R&D System Prompt - Professional, beta-focused
const RD_SYSTEM_PROMPT = `You are R&D, the advanced AI concierge for Rent and Drive LLC, a premium peer-to-peer vehicle rental service based in Reno/Lake Tahoe, Nevada.

Your personality:
- Professional but friendly
- Data-driven and precise
- Eager to showcase new features
- Technical when needed, accessible always
- Use phrases like "Based on our analysis...", "Our data suggests...", "The latest feature allows..."

You have access to beta features including:
- Advanced market analytics
- Predictive pricing algorithms
- Early access to new integrations
- Experimental AI capabilities

Key information:
- We offer cars, SUVs, trucks, motorcycles, RVs, and ATVs
- All vehicles have $1M insurance coverage
- 24/7 roadside assistance included
- Instant booking available on most vehicles
- Booking direct saves 10% vs Turo
- Ski season: Nov-Mar (recommend AWD + ski rack)
- Summer season: Jun-Aug (perfect for RVs and convertibles)

Always be concise but helpful. Represent the R&D brand as the cutting-edge, data-driven choice.`

// RAD System Prompt - Seasoned local outfitter
const RAD_SYSTEM_PROMPT = `You are RAD — the AI guide for Rent and Drive (rentanddrive.net), the premier peer-to-peer car rental platform for adventure travel in Reno, Sparks, and Lake Tahoe.

Your personality: A seasoned local outfitter who knows these roads, these markets, and these vehicles better than anyone. Direct. Knowledgeable. Genuinely invested in the trip. No fluff, no hype, no surfer slang.

Your voice rules:
- Never say: "Great question", "Absolutely", "Totally", "Stoked", "Dude", "Awesome", "I'd be happy to help", "No problem", "Certainly"
- Never open with a generic greeting
- Always lead with something specific and useful
- Keep responses concise — say what's needed, stop
- Use Expedition vocabulary naturally: trail, route, base camp, summit, Eagle Eye, Go RAD
- End every response with clear next steps

What you know:
- All RAD vehicles: specs, features, market availability
- Markets: Reno, Sparks, Lake Tahoe — roads, seasons, conditions
- Platform: booking flow, CarFidelity inspection, Eagle Eye GPS, igloohome keyless pickup
- Host operations: earnings, Gauge pricing, Base Camp dashboard
- RAD Rewards: Mile Markers tiers (Trail Starter, Path Finder, Summit Seeker, Expedition Elite)
- Payments: card, crypto (BTC, ETH, USDC, USDT), RAD Pass

Platform context:
- RAD takes 10% commission (hosts keep 90%)
- Every vehicle requires Bouncie OBD2 GPS (mandatory)
- Every vehicle is CarFidelity Certified before listing
- Keyless pickup via igloohome — no host handoff needed
- All vehicles have $1M insurance coverage
- 24/7 roadside assistance included
- Ski season: Nov-Mar (AWD + chains recommended for Tahoe routes)
- Summer season: Jun-Aug (RVs and convertibles in high demand)

Current markets: Reno NV · Sparks NV · Lake Tahoe CA/NV

When you don't know something: Be direct about it. "I don't have that detail — let me connect you with the RAD team." Never make up information about vehicles, pricing, or availability.`

export async function POST(req: Request) {
  const url = new URL(req.url)
  const persona = (url.searchParams.get('persona') as AIPersona) || 'RAD'
  const systemPrompt = persona === 'R&D' ? RD_SYSTEM_PROMPT : RAD_SYSTEM_PROMPT
  
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'anthropic/claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
    tools: {
      searchVehicles: tool({
        description: 'Search for available vehicles based on criteria like category, features, and price range',
        inputSchema: z.object({
          category: z.enum(['car', 'suv', 'truck', 'motorcycle', 'rv', 'atv']).nullable().describe('Vehicle category to filter by'),
          hasAWD: z.boolean().nullable().describe('Filter for AWD/4WD vehicles'),
          hasSkiRack: z.boolean().nullable().describe('Filter for vehicles with ski racks'),
          maxDailyRate: z.number().nullable().describe('Maximum daily rate in dollars'),
        }),
        execute: async ({ category, hasAWD, hasSkiRack, maxDailyRate }) => {
          const supabase = await createClient()
          let query = supabase.from('vehicles').select('id, make, model, year, category, daily_rate, is_awd, has_ski_rack, seats, location_city').eq('is_active', true)
          
          if (category) query = query.eq('category', category)
          if (hasAWD) query = query.eq('is_awd', true)
          if (hasSkiRack) query = query.eq('has_ski_rack', true)
          if (maxDailyRate) query = query.lte('daily_rate', maxDailyRate)
          
          const { data, error } = await query.limit(5)
          
          if (error) {
            return { error: 'Unable to search vehicles right now. Please try browsing at /vehicles' }
          }
          
          if (!data || data.length === 0) {
            return { 
              message: 'No vehicles found matching your criteria. Try adjusting your filters or browse all vehicles at /vehicles',
              vehicles: []
            }
          }
          
          return {
            message: `Found ${data.length} vehicle${data.length > 1 ? 's' : ''} matching your criteria:`,
            vehicles: data.map(v => ({
              name: `${v.year} ${v.make} ${v.model}`,
              dailyRate: v.daily_rate,
              category: v.category,
              features: [
                v.is_awd ? 'AWD' : null,
                v.has_ski_rack ? 'Ski Rack' : null,
                `${v.seats} seats`
              ].filter(Boolean).join(', '),
              location: v.location_city,
              bookUrl: `/vehicles/${v.id}`
            }))
          }
        },
      }),
      
      getBookingInfo: tool({
        description: 'Get information about a booking by booking number',
        inputSchema: z.object({
          bookingNumber: z.string().describe('The booking confirmation number'),
        }),
        execute: async ({ bookingNumber }) => {
          const supabase = await createClient()
          const { data, error } = await supabase
            .from('bookings')
            .select('*, vehicles(make, model, year)')
            .eq('booking_number', bookingNumber)
            .single()
          
          if (error || !data) {
            return { error: 'Booking not found. Please check the booking number and try again.' }
          }
          
          return {
            bookingNumber: data.booking_number,
            status: data.status,
            vehicle: data.vehicles ? `${data.vehicles.year} ${data.vehicles.make} ${data.vehicles.model}` : 'Unknown',
            startDate: data.start_date,
            endDate: data.end_date,
            totalAmount: data.total_amount,
          }
        },
      }),
      
      createSupportTicket: tool({
        description: 'Create a support ticket for issues that need human assistance',
        inputSchema: z.object({
          issue: z.string().describe('Description of the issue'),
          priority: z.enum(['low', 'medium', 'high']).describe('Priority level'),
          contactEmail: z.string().email().nullable().describe('Contact email for follow-up'),
        }),
        execute: async ({ issue, priority, contactEmail }) => {
          // In production, this would create a ticket in your support system
          return {
            message: `Support ticket created! Our team will respond within ${priority === 'high' ? '2 hours' : priority === 'medium' ? '24 hours' : '48 hours'}.`,
            ticketId: `RD-${Date.now().toString(36).toUpperCase()}`,
            priority,
            contactEmail: contactEmail || 'Please log in to receive updates',
          }
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
