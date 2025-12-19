export interface AuthSession {
  token: string
  tenantId: number
  user: {
    id: number
    email: string
    firstName?: string
    lastName?: string
    name?: string
    role?: string
    userType?: {
      id: number
      slug: string
      hierarchyLevel: number
    }
  }
}

const SESSION_STORAGE_KEY = 'auth.session'

/**
 * Save authentication session to localStorage
 * @param session Authentication session data
 */
export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    // Failed to save session
  }
}

/**
 * Read authentication session from localStorage
 * @returns AuthSession or null if not found/invalid
 */
export function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    
    const session = JSON.parse(raw)

    // Validate session structure
    if (!session.token || !session.tenantId || !session.user) {
      clearSession()
      return null
    }

    return session
  } catch (error) {
    clearSession()
    return null
  }
}

/**
 * Clear authentication session from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch (error) {
    // Failed to clear session
  }
}

/**
 * Check if user is currently authenticated
 * @returns boolean indicating if session exists and is valid
 */
export function isAuthenticated(): boolean {
  const session = readSession()
  return session !== null && Boolean(session.token && session.tenantId)
}