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
        agent: AGENT_CONFIGS.beacon,
        preview_text: `Welcome back, ${firstName} — your fleet has activity`,
        full_message: `Good to see you, ${firstName}. Your vehicles are getting views. Head to Eagle Eye HQ for your fleet overview, or check Base Camp for recent bookings.`,
        context: { page: 'home', role: 'host', profile },
        action_buttons: [
          { label: 'Eagle Eye HQ', action: '/hostslab/eagle-eye', variant: 'primary' },
          { label: 'View earnings', action: '/host/earnings', variant: 'secondary' },
        ]
      }
    }
    
    if (profile?.role === 'renter') {
      const tripCount = profile.total_trips ?? 0
      const tierName = profile.loyalty_tier ?? 'Trail Starter'
      return {
        agent: AGENT_CONFIGS.beacon,
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
      agent: AGENT_CONFIGS.beacon,
      preview_text: 'Find the right vehicle for where you\'re going',
      full_message: 'Tell me where you\'re headed — I\'ll find you the right vehicle. Tahoe, Moab, Bozeman, or anywhere in between.',
      context: { page: 'home', role: 'visitor' },
      action_buttons: [
        { label: 'Browse Tahoe', action: '/vehicles?market=tahoe', variant: 'primary' },
        { label: 'Browse Moab', action: '/vehicles?market=moab', variant: 'secondary' },
        { label: 'Browse Reno', action: '/vehicles?market=reno', variant: 'secondary' },
      ]
    }
  }

  // BROWSE / SEARCH PAGE
  if (pathname.startsWith('/vehicles') || pathname.startsWith('/search')) {
    return {
      agent: AGENT_CONFIGS.outfitter,
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
      agent: AGENT_CONFIGS.outfitter,
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
      agent: AGENT_CONFIGS.outfitter,
      preview_text: 'Before you confirm — one thing to know',
      full_message: 'Almost there. If you\'re heading to the mountains, consider adding snow chains. For desert trips, a cargo liner protects against dust. Need any add-ons?',
      context: { page: 'booking', profile },
      action_buttons: [
        { label: 'Add snow chains', action: 'add_addon_chains', variant: 'secondary' },
        { label: 'Continue booking', action: 'continue', variant: 'primary' },
      ]
    }
  }

  // HOST DASHBOARD — BASE CAMP
  if (pathname.startsWith('/host')) {
    return {
      agent: AGENT_CONFIGS.gauge,
      preview_text: 'Gauge has a pricing insight for your fleet',
      full_message: `Morning, ${firstName}. I've been monitoring your fleet's performance. Check Eagle Eye HQ for your utilization metrics, or let's review your pricing strategy.`,
      context: { page: 'host_dashboard', profile },
      action_buttons: [
        { label: 'Update pricing', action: '/host/pricing', variant: 'primary' },
        { label: 'View Eagle Eye', action: '/hostslab/eagle-eye', variant: 'secondary' },
      ]
    }
  }

  // EAGLE EYE HQ
  if (pathname.startsWith('/hostslab/eagle-eye')) {
    return {
      agent: AGENT_CONFIGS.vitals,
      preview_text: 'Vitals has a fleet health update',
      full_message: 'Fleet status looks good. I\'m tracking maintenance schedules and vehicle condition. Any specific vehicles you want me to check on?',
      context: { page: 'eagle_eye', profile },
    }
  }

  // HOSTSLAB / RAD HOSTS AREA
  if (pathname.startsWith('/hostslab')) {
    return {
      agent: AGENT_CONFIGS.beacon,
      preview_text: `${firstName}, your RAD Hosts hub is ready`,
      full_message: 'Welcome to RAD Hosts. This is your command center. What would you like to focus on — fleet management, pricing optimization, or checking your metrics?',
      context: { page: 'hostslab', profile },
      action_buttons: [
        { label: 'Fleet overview', action: '/hostslab/eagle-eye', variant: 'primary' },
        { label: 'Pricing tools', action: '/host/pricing', variant: 'secondary' },
      ]
    }
  }

  // RENTER SUITE / RAD RENTERS
  if (pathname.startsWith('/renter')) {
    return {
      agent: AGENT_CONFIGS.beacon,
      preview_text: `${firstName}, your RAD Renters hub`,
      full_message: `This is your home base, ${firstName}. Check your upcoming trips, browse saved vehicles, or explore RAD Rewards. What can I help you with?`,
      context: { page: 'renter_suite', profile },
      action_buttons: [
        { label: 'My RAD Trips', action: '/renter/trips', variant: 'primary' },
        { label: 'RAD Rewards', action: '/renter/rewards', variant: 'secondary' },
      ]
    }
  }

  // SIGN UP / ONBOARDING
  if (pathname.startsWith('/sign-up') || pathname.startsWith('/signup') || pathname.startsWith('/onboarding')) {
    return {
      agent: AGENT_CONFIGS.beacon,
      preview_text: 'Welcome to RAD — let\'s get you set up',
      full_message: 'Welcome. I\'m Beacon — your main contact on RAD. Setup takes about 3 minutes. Want to start as a renter, a host, or both?',
      context: { page: 'signup' },
      action_buttons: [
        { label: 'I want to rent', action: 'role_renter', variant: 'primary' },
        { label: 'I want to host', action: 'role_host', variant: 'primary' },
        { label: 'Both', action: 'role_both', variant: 'secondary' },
      ]
    }
  }

  return null
}
