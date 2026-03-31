import { AGENT_CONFIGS, AgentConfig } from './agent-configs'

export interface ActionButton {
  label: string
  action: string
  variant: 'primary' | 'secondary'
}

export interface ProactiveMessage {
  agent: AgentConfig
  preview_text: string
  full_message: string
  context: Record<string, unknown>
  action_buttons?: ActionButton[]
}

export interface UserProfile {
  id?: string
  first_name?: string
  role?: 'host' | 'renter' | 'both'
  total_trips?: number
  loyalty_tier?: string
  fleet_count?: number
}

export interface AgentPreferences {
  proactive_messages?: boolean
  message_delay_seconds?: number
  preferred_agent?: string
}

interface ProactiveMessageParams {
  pathname: string
  user: { id: string; email?: string } | null
  profile: UserProfile | null
  preferences: AgentPreferences | null
}

export async function getProactiveMessage({
  pathname,
  user,
  profile,
  preferences,
}: ProactiveMessageParams): Promise<ProactiveMessage | null> {
  const firstName = profile?.first_name || 'there'

  // HOME PAGE
  if (pathname === '/') {
    if (profile?.role === 'host') {
      return {
        agent: AGENT_CONFIGS['rad-comms'],
        preview_text: `Welcome back, ${firstName} — your fleet has activity`,
        full_message: `Good to see you, ${firstName}. Your vehicles are getting views. Head to Fleet Tracker for your fleet overview, or check the Command Center for recent bookings.`,
        context: { page: 'home', role: 'host', profile },
        action_buttons: [
          { label: 'Fleet Tracker', action: '/hostslab/eagle-eye', variant: 'primary' },
          { label: 'View earnings', action: '/host/earnings', variant: 'secondary' },
        ]
      }
    }
    
    if (profile?.role === 'renter') {
      const tripCount = profile.total_trips ?? 0
      const tierName = profile.loyalty_tier ?? 'Trail Starter'
      return {
        agent: AGENT_CONFIGS['rad-comms'],
        preview_text: `Hey ${firstName} — ready for your next RAD trip?`,
        full_message: tripCount > 0 
          ? `Welcome back, ${firstName}. You've completed ${tripCount} RAD trips as a ${tierName}. Ready to book your next adventure?`
          : `Hey ${firstName}, welcome to RAD. Tell me where you're headed and I'll find you the right vehicle.`,
        context: { page: 'home', role: 'renter', profile },
        action_buttons: [
          { label: 'Browse vehicles', action: '/vehicles', variant: 'primary' },
          { label: 'My RAD Trips', action: '/renter/trips', variant: 'secondary' },
        ]
      }
    }

    // New visitor
    return {
      agent: AGENT_CONFIGS['rad-comms'],
      preview_text: 'Where are you headed?',
      full_message: 'RAD connects you directly with local vehicle owners — no rental counters, no corporate fleet. Every vehicle is CarFidelity inspected and GPS tracked. What market are you heading to?',
      context: { page: 'home', role: 'visitor' },
      action_buttons: [
        { label: 'Reno/Sparks', action: '/vehicles?market=reno', variant: 'primary' },
        { label: 'Lake Tahoe', action: '/vehicles?market=tahoe', variant: 'secondary' },
      ]
    }
  }

  // BROWSE / SEARCH PAGE
  if (pathname.startsWith('/vehicles') || pathname.startsWith('/search')) {
    return {
      agent: AGENT_CONFIGS['rad-upsell'],
      preview_text: 'Tell me what you need — I\'ll narrow it down',
      full_message: 'Looking for something specific? Tell me your destination, dates, or what kind of adventure you\'re planning and I\'ll point you to the right vehicles.',
      context: { page: 'browse', profile },
      action_buttons: [
        { label: 'AWD vehicles', action: '?filter=awd', variant: 'secondary' },
        { label: 'Best for Tahoe', action: '?market=tahoe', variant: 'secondary' },
      ]
    }
  }

  // VEHICLE DETAIL PAGE
  if (pathname.startsWith('/vehicles/')) {
    const vehicleId = pathname.split('/')[2]
    return {
      agent: AGENT_CONFIGS['rad-upsell'],
      preview_text: 'This vehicle has something worth knowing',
      full_message: 'Good choice. This one\'s popular with adventure travelers. Want me to check availability for your dates, or tell you about the add-ons that pair well with it?',
      context: { page: 'vehicle_detail', vehicleId, profile },
      action_buttons: [
        { label: 'Check availability', action: '#availability', variant: 'primary' },
        { label: 'Ask about add-ons', action: 'ask_addons', variant: 'secondary' },
      ]
    }
  }

  // BOOKING / CHECKOUT PAGE
  if (pathname.startsWith('/book') || pathname.startsWith('/checkout')) {
    return {
      agent: AGENT_CONFIGS['rad-upsell'],
      preview_text: 'Before you confirm — one thing to know',
      full_message: 'Almost there. If you\'re heading to the mountains, consider adding snow chains. For desert trips, a cargo liner protects against dust. Need any add-ons?',
      context: { page: 'booking', profile },
      action_buttons: [
        { label: 'Add snow chains', action: 'add_addon_chains', variant: 'secondary' },
        { label: 'Continue booking', action: 'continue', variant: 'primary' },
      ]
    }
  }

  // HOST DASHBOARD — COMMAND CENTER
  if (pathname.startsWith('/host')) {
    return {
      agent: AGENT_CONFIGS['rad-pricing'],
      preview_text: 'RAD Pricing has a pricing insight for your fleet',
      full_message: `Morning, ${firstName}. I've been monitoring your fleet's performance. Check Fleet Tracker for your utilization metrics, or let's review your pricing strategy.`,
      context: { page: 'host_dashboard', profile },
      action_buttons: [
        { label: 'Update pricing', action: '/host/pricing', variant: 'primary' },
        { label: 'View Fleet Tracker', action: '/hostslab/eagle-eye', variant: 'secondary' },
      ]
    }
  }

  // FLEET TRACKER
  if (pathname.startsWith('/hostslab/eagle-eye')) {
    return {
      agent: AGENT_CONFIGS['rad-fleet'],
      preview_text: 'RAD Fleet has a fleet health update',
      full_message: 'Fleet status looks good. I\'m tracking maintenance schedules and vehicle condition. Any specific vehicles you want me to check on?',
      context: { page: 'fleet_tracker', profile },
    }
  }

  // RAD HOSTS AREA
  if (pathname.startsWith('/hostslab')) {
    return {
      agent: AGENT_CONFIGS['rad-comms'],
      preview_text: `${firstName}, your RAD Hosts hub is ready`,
      full_message: 'Welcome to RAD Hosts. This is your Command Center. What would you like to focus on — fleet management, pricing optimization, or checking your metrics?',
      context: { page: 'rad_hosts', profile },
      action_buttons: [
        { label: 'Fleet overview', action: '/hostslab/eagle-eye', variant: 'primary' },
        { label: 'Pricing tools', action: '/host/pricing', variant: 'secondary' },
      ]
    }
  }

  // RAD RENTERS
  if (pathname.startsWith('/renter')) {
    return {
      agent: AGENT_CONFIGS['rad-comms'],
      preview_text: `${firstName}, your RAD Renters hub`,
      full_message: `This is your home base, ${firstName}. Check your upcoming trips, browse saved vehicles, or explore RAD Rewards. What can I help you with?`,
      context: { page: 'rad_renters', profile },
      action_buttons: [
        { label: 'My RAD Trips', action: '/renter/trips', variant: 'primary' },
        { label: 'RAD Rewards', action: '/renter/rewards', variant: 'secondary' },
      ]
    }
  }

  // SIGN UP / ONBOARDING
  if (pathname.startsWith('/sign-up') || pathname.startsWith('/signup') || pathname.startsWith('/onboarding')) {
    return {
      agent: AGENT_CONFIGS['rad-comms'],
      preview_text: 'Setup takes 3 minutes',
      full_message: 'Renter or host — your call. Renters get access to the fleet immediately. Hosts need a CarFidelity inspection first. Which path?',
      context: { page: 'signup' },
      action_buttons: [
        { label: 'Rent vehicles', action: 'role_renter', variant: 'primary' },
        { label: 'List my vehicle', action: 'role_host', variant: 'primary' },
        { label: 'Both', action: 'role_both', variant: 'secondary' },
      ]
    }
  }

  return null
}
