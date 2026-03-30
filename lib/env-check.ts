/**
 * Environment Variable Check
 * Logs which services are configured and which are running in mock mode
 * Never crashes on missing optional keys - always graceful fallback
 */

interface ServiceStatus {
  name: string
  status: 'live' | 'mock' | 'missing'
  envVars: string[]
}

export function checkEnvironment(): ServiceStatus[] {
  const services: ServiceStatus[] = [
    // Required Services
    {
      name: 'SUPABASE',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? 'live' : 'missing',
      envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
    },
    // Payment
    {
      name: 'STRIPE',
      status: process.env.STRIPE_SECRET_KEY ? 'live' : 'mock',
      envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']
    },
    // Communications
    {
      name: 'TWILIO',
      status: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? 'live' : 'mock',
      envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
    },
    {
      name: 'SENDGRID',
      status: process.env.SENDGRID_API_KEY ? 'live' : 'mock',
      envVars: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL']
    },
    // Fleet Tracking
    {
      name: 'BOUNCIE',
      status: process.env.BOUNCIE_API_KEY ? 'live' : 'mock',
      envVars: ['BOUNCIE_API_KEY', 'BOUNCIE_CLIENT_ID', 'BOUNCIE_CLIENT_SECRET', 'BOUNCIE_WEBHOOK_SECRET']
    },
    // Lockbox
    {
      name: 'IGLOO',
      status: process.env.IGLOO_API_KEY ? 'live' : 'mock',
      envVars: ['IGLOO_API_KEY', 'IGLOO_CLIENT_ID', 'IGLOO_CLIENT_SECRET']
    },
    // Insurance
    {
      name: 'TINT',
      status: process.env.TINT_API_KEY ? 'live' : 'mock',
      envVars: ['TINT_API_KEY', 'TINT_PARTNER_ID']
    },
    // VIN Check
    {
      name: 'CARFAX',
      status: process.env.CARFAX_API_KEY ? 'live' : 'mock',
      envVars: ['CARFAX_API_KEY', 'CARFAX_PARTNER_ID']
    },
    // AI Providers
    {
      name: 'OPENAI',
      status: process.env.OPENAI_API_KEY ? 'live' : 'mock',
      envVars: ['OPENAI_API_KEY']
    },
    {
      name: 'ANTHROPIC',
      status: process.env.ANTHROPIC_API_KEY ? 'live' : 'mock',
      envVars: ['ANTHROPIC_API_KEY']
    },
    {
      name: 'PERPLEXITY',
      status: process.env.PERPLEXITY_API_KEY ? 'live' : 'mock',
      envVars: ['PERPLEXITY_API_KEY']
    },
    {
      name: 'GROQ',
      status: process.env.GROQ_API_KEY ? 'live' : 'mock',
      envVars: ['GROQ_API_KEY']
    },
    // Ride Services
    {
      name: 'LYFT',
      status: process.env.LYFT_CLIENT_ID ? 'live' : 'mock',
      envVars: ['LYFT_CLIENT_ID', 'LYFT_CLIENT_SECRET']
    },
    {
      name: 'UBER',
      status: process.env.UBER_CLIENT_ID ? 'live' : 'mock',
      envVars: ['UBER_CLIENT_ID', 'UBER_CLIENT_SECRET']
    },
  ]

  return services
}

export function logEnvironmentStatus(): void {
  const services = checkEnvironment()
  
  console.log('\n========================================')
  console.log('  RENT AND DRIVE - SERVICE STATUS')
  console.log('========================================')
  
  const liveServices = services.filter(s => s.status === 'live')
  const mockServices = services.filter(s => s.status === 'mock')
  const missingServices = services.filter(s => s.status === 'missing')
  
  if (liveServices.length > 0) {
    console.log('\n✓ LIVE SERVICES:')
    liveServices.forEach(s => console.log(`  ${s.name}: live`))
  }
  
  if (mockServices.length > 0) {
    console.log('\n⚠ MOCK MODE (optional):')
    mockServices.forEach(s => console.log(`  ${s.name}: mock`))
  }
  
  if (missingServices.length > 0) {
    console.log('\n✗ MISSING (required):')
    missingServices.forEach(s => {
      console.log(`  ${s.name}: missing`)
      console.log(`    Required: ${s.envVars.join(', ')}`)
    })
  }
  
  console.log('\n========================================\n')
}

export function getServiceStatus(serviceName: string): 'live' | 'mock' | 'missing' {
  const services = checkEnvironment()
  const service = services.find(s => s.name === serviceName)
  return service?.status || 'missing'
}

export function isServiceLive(serviceName: string): boolean {
  return getServiceStatus(serviceName) === 'live'
}
