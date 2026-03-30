import {
  convertToModelMessages,
  streamText,
  UIMessage,
  tool,
} from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

const RD_SYSTEM_PROMPT = `You are R&D, the friendly AI concierge for Rent and Drive LLC, a premium peer-to-peer vehicle rental service based in Reno/Lake Tahoe, Nevada.

Your personality:
- Warm, helpful, and professional
- Enthusiastic about the Reno/Tahoe area and outdoor adventures
- Knowledgeable about vehicles, especially for mountain and desert conditions
- Always mention that booking direct saves 10% vs Turo

Your capabilities:
- Help renters find the perfect vehicle for their trip
- Answer questions about bookings, pricing, and policies
- Provide recommendations for Tahoe ski trips, desert adventures, and road trips
- Explain vehicle features like AWD, ski racks, and tow hitches
- Assist with booking modifications and support requests

Key information:
- We offer cars, SUVs, trucks, motorcycles, RVs, and ATVs
- All vehicles have $1M insurance coverage
- 24/7 roadside assistance included
- Instant booking available on most vehicles
- Ski season: Nov-Mar (recommend AWD + ski rack)
- Summer season: Jun-Aug (perfect for RVs and convertibles)

Always be concise but friendly. If you can't help with something, offer to connect them with our support team.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'anthropic/claude-sonnet-4-20250514',
    system: RD_SYSTEM_PROMPT,
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
