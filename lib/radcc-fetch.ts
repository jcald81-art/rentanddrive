'use client'

/**
 * RADCC (RAD Command Center) Fetch Utility
 * Provides robust fetching with debug logging, retry logic, and error handling
 */

// Debug mode - check localStorage on client side
const getDebugMode = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('radcc_debug') === 'true'
}

export const enableDebugMode = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('radcc_debug', 'true')
    console.log('🔧 [RADCC] Debug mode ENABLED')
  }
}

export const disableDebugMode = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('radcc_debug')
    console.log('🔧 [RADCC] Debug mode DISABLED')
  }
}

export const isDebugMode = getDebugMode

interface FetchOptions extends RequestInit {
  maxRetries?: number
  retryDelay?: number
}

interface FetchResult<T> {
  data: T | null
  error: string | null
  status: number
  rawResponse?: string
}

/**
 * RADCC Fetch with debug logging, retry logic, and error handling
 */
export async function radccFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const { maxRetries = 2, retryDelay = 1000, ...fetchOptions } = options
  const debug = getDebugMode()
  
  let lastError: string | null = null
  let lastStatus = 0
  let lastRawResponse: string | undefined
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Log before fetch
      if (debug || attempt > 0) {
        console.log(`🔍 [RADCC DEBUG] Fetching: ${url}`, {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          method: fetchOptions.method || 'GET',
          hasBody: !!fetchOptions.body,
        })
      }
      
      const response = await fetch(url, fetchOptions)
      lastStatus = response.status
      
      // Log response status
      if (debug) {
        console.log(`📥 [RADCC DEBUG] Response status: ${response.status} for ${url}`)
      }
      
      // Get raw text first
      const rawText = await response.text()
      lastRawResponse = rawText
      
      // Check if response is OK
      if (!response.ok) {
        console.error(`❌ [RADCC DEBUG] API ERROR: ${response.status} for ${url}`)
        console.error(`❌ [RADCC DEBUG] Response body:`, rawText.substring(0, 500))
        
        // Check if we got HTML instead of JSON (404 page)
        if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html')) {
          lastError = `Received HTML instead of JSON. Endpoint may not exist: ${url}`
        } else {
          lastError = rawText || `HTTP ${response.status}`
        }
        
        // Don't retry on 401/403
        if (response.status === 401 || response.status === 403) {
          return { data: null, error: lastError, status: lastStatus, rawResponse: lastRawResponse }
        }
        
        // Retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt)
          console.log(`⏳ [RADCC DEBUG] Retrying in ${delay}ms...`)
          await new Promise(r => setTimeout(r, delay))
          continue
        }
        
        return { data: null, error: lastError, status: lastStatus, rawResponse: lastRawResponse }
      }
      
      // Try to parse JSON
      try {
        const data = JSON.parse(rawText) as T
        if (debug) {
          console.log(`✅ [RADCC DEBUG] Success for ${url}:`, data)
        }
        return { data, error: null, status: lastStatus }
      } catch (parseError) {
        console.error(`❌ [RADCC DEBUG] JSON parse error for ${url}:`, parseError)
        console.error(`❌ [RADCC DEBUG] Raw response:`, rawText.substring(0, 500))
        lastError = `JSON parse error: ${parseError}. Raw: ${rawText.substring(0, 200)}`
        return { data: null, error: lastError, status: lastStatus, rawResponse: lastRawResponse }
      }
      
    } catch (networkError) {
      console.error(`❌ [RADCC DEBUG] Network error for ${url}:`, networkError)
      lastError = `Network error: ${networkError}`
      lastStatus = 0
      
      // Retry on network errors
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt)
        console.log(`⏳ [RADCC DEBUG] Retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
    }
  }
  
  return { data: null, error: lastError, status: lastStatus, rawResponse: lastRawResponse }
}

/**
 * Helper to track failed endpoints
 */
export class FailedEndpointTracker {
  private failures: Map<string, { count: number; lastError: string; lastTime: Date }> = new Map()
  
  recordFailure(url: string, error: string) {
    const existing = this.failures.get(url)
    this.failures.set(url, {
      count: (existing?.count || 0) + 1,
      lastError: error,
      lastTime: new Date(),
    })
  }
  
  clearFailure(url: string) {
    this.failures.delete(url)
  }
  
  getFailures(): Array<{ url: string; count: number; lastError: string; lastTime: Date }> {
    return Array.from(this.failures.entries()).map(([url, data]) => ({ url, ...data }))
  }
  
  hasFailures(): boolean {
    return this.failures.size > 0
  }
  
  clear() {
    this.failures.clear()
  }
}

// Global instance for tracking
export const endpointTracker = new FailedEndpointTracker()
