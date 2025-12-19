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
 * Attempts SSO login using token and tenantId from querystring or sessionStorage
 * Returns true if SSO was attempted, false if no SSO params found
 */
export async function consumeSso(): Promise<boolean> {
  // First check URL params
  let { token, tenantId } = extractSsoParams()

  // If not in URL, check sessionStorage (in case they were preserved from a previous attempt)
  if (!token || !tenantId) {
    const stored = sessionStorage.getItem('tq-sso-params')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        token = parsed.token
        tenantId = parsed.tenantId
      } catch {
        // Ignore parse errors
      }
    }
  } else {
    // Store in sessionStorage for resilience
    sessionStorage.setItem('tq-sso-params', JSON.stringify({ token, tenantId }))
  }

  if (!token || !tenantId) {
    return false
  }

  const tenantIdNum = parseInt(tenantId, 10)
  if (isNaN(tenantIdNum)) {
    return false
  }

  try {
    // Check if this is a different user/tenant than what's currently stored
    const currentState = useAuthStore.getState()
    const isDifferentSession = currentState.token !== token || currentState.tenantId !== tenantIdNum

    if (isDifferentSession && currentState.token) {
      const { logout } = currentState
      logout() // This will clear the persisted state
    }

    const { loginWithToken } = useAuthStore.getState()
    await loginWithToken(token, tenantIdNum)

    // Clear SSO params from URL and sessionStorage after successful login
    clearSsoParams()
    sessionStorage.removeItem('tq-sso-params')

    return true
  } catch (error) {
    // Clear SSO params even on failure to prevent retry loops
    clearSsoParams()
    sessionStorage.removeItem('tq-sso-params')
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
 * Checks if current URL or sessionStorage contains SSO parameters
 * If found in URL, immediately preserves them in sessionStorage
 */
export function hasSsoParams(): boolean {
  const { token, tenantId } = extractSsoParams()

  // First check URL - if found, preserve in sessionStorage immediately
  if (token && tenantId) {
    sessionStorage.setItem('tq-sso-params', JSON.stringify({ token, tenantId }))
    return true
  }

  // Then check sessionStorage
  const stored = sessionStorage.getItem('tq-sso-params')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return !!(parsed.token && parsed.tenantId)
    } catch {
      return false
    }
  }

  return false
}