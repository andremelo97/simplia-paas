import { useAuthStore } from '../shared/store'

interface SsoParams {
  token?: string
  tenantId?: string
}

/**
 * Extracts SSO parameters from URL querystring
 */
export function extractSsoParams(): SsoParams {
  if (typeof window === 'undefined') return {}

  const urlParams = new URLSearchParams(window.location.search)
  return {
    token: urlParams.get('token') || undefined,
    tenantId: urlParams.get('tenantId') || undefined
  }
}

/**
 * Attempts SSO login using token and tenantId from querystring or existing session
 * Returns true if SSO was attempted, false if no SSO params found
 */
export async function consumeSso(): Promise<boolean> {
  // Check URL params for SSO
  const { token, tenantId } = extractSsoParams()

  if (!token || !tenantId) {
    return false
  }

  const tenantIdNum = parseInt(tenantId, 10)
  if (isNaN(tenantIdNum)) {
    console.error('Invalid tenantId in SSO params:', tenantId)
    return false
  }

  try {
    console.log('🔄 [TQ SSO] Attempting SSO login with URL params...')
    const { loginWithToken } = useAuthStore.getState()
    await loginWithToken(token, tenantIdNum)

    // Clear SSO params from URL after successful login
    clearSsoParams()

    return true
  } catch (error) {
    console.error('❌ [TQ SSO] SSO login failed:', error)
    // Clear SSO params even on failure to prevent retry loops
    clearSsoParams()
    throw error
  }
}

/**
 * Removes SSO parameters from URL without triggering navigation
 */
export function clearSsoParams(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.delete('token')
  url.searchParams.delete('tenantId')

  // Update URL without triggering navigation
  window.history.replaceState({}, '', url.toString())
}

/**
 * Checks if current URL contains SSO parameters
 */
export function hasSsoParams(): boolean {
  const { token, tenantId } = extractSsoParams()
  return !!(token && tenantId)
}