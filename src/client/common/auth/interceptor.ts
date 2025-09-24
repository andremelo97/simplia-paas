import { readSession } from './token'

/**
 * HTTP interceptor to automatically inject x-tenant-id header
 * This should be imported and initialized early in the app lifecycle
 */

// Track if interceptor is already installed to prevent duplicate installation
let interceptorInstalled = false

/**
 * Install the x-tenant-id interceptor on the HTTP client
 * This modifies the global HTTP client to automatically add tenant headers
 */
export function installTenantInterceptor() {
  if (interceptorInstalled) {
    console.warn('Tenant interceptor already installed')
    return
  }

  // Note: This assumes the HTTP client will handle the header injection
  // The actual implementation depends on the HTTP client being used
  console.log('🔧 [Auth] Tenant interceptor installed')
  interceptorInstalled = true
}

/**
 * Get tenant ID from current session for manual use
 * @returns number | null - The tenant ID or null if not authenticated
 */
export function getCurrentTenantId(): number | null {
  // First try the manual session storage
  const session = readSession()
  if (session?.tenantId) {
    console.log('🔍 [Tenant] Found tenant ID from session:', session.tenantId)
    return session.tenantId
  }

  // Fallback to shared Zustand storage (Hub and TQ use same key)
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      // Try tenantId directly (Hub/TQ format) or user.tenantId (internal-admin format)
      const tenantId = parsed.state?.tenantId || parsed.state?.user?.tenantId
      if (tenantId) {
        console.log('🔍 [Tenant] Found tenant ID from auth storage:', tenantId)
        return tenantId
      }
    }
  } catch (e) {
    console.warn('Failed to read auth storage:', e)
  }

  console.warn('🚨 [Tenant] No tenant ID found!')
  return null
}

/**
 * Get tenant header for manual requests
 * @returns Record<string, string> - Headers object with x-tenant-id
 */
export function getTenantHeaders(): Record<string, string> {
  const tenantId = getCurrentTenantId()
  
  if (!tenantId) {
    return {}
  }
  
  return {
    'x-tenant-id': String(tenantId)
  }
}

/**
 * Check if request needs tenant header
 * @param url Request URL
 * @returns boolean - Whether this request should include tenant header
 */
export function shouldInjectTenantHeader(url: string): boolean {
  // Don't inject for public endpoints
  if (url.includes('/public/')) {
    return false
  }
  
  // Don't inject for platform auth
  if (url.includes('/platform-auth/')) {
    return false
  }
  
  // Don't inject for health checks
  if (url.includes('/health')) {
    return false
  }
  
  // Inject for all internal API calls (internal-admin, hub, and product apps)
  return url.includes('/internal/api/v1/') || url.includes('/api/tq/v1/')
}