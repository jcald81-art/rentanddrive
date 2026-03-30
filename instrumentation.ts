/**
 * Next.js Instrumentation
 * Runs once when the server starts
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logEnvironmentStatus } = await import('./lib/env-check')
    
    // Log service status on startup
    logEnvironmentStatus()
    
    console.log('Rent and Drive Platform Starting...')
    console.log(`Environment: ${process.env.NODE_ENV}`)
    console.log(`App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`)
  }
}
