import { AppError, createAppError, isAppError } from '../common/feedback/types'
import { mapStatusToErrorCode, getErrorMessage, FEEDBACK_CATALOG } from '../common/feedback/catalog'
import { publishFeedback, resolveFeedbackMessage } from '../common/feedback'
import { shouldInjectTenantHeader, getCurrentTenantId } from '../common/auth/interceptor'

// HTTP client configuration
// In production with custom domains, each app calls its own domain's API
// In development, use relative paths (Vite proxy handles routing)
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || ''

class HttpClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request(endpoint: string, options: RequestInit & { params?: Record<string, any> } = {}) {
    // Handle query parameters
    let url = `${this.baseURL}${endpoint}`
    if (options.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }
    
    // Get auth token from localStorage (persisted by Zustand)
    // Hub and TQ share the same 'auth-storage' key
    const authStorage = localStorage.getItem('auth-storage')
    let token: string | null = null
    
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)
        token = parsed.state?.token || null
      } catch (e) {
        console.warn('Failed to parse auth storage:', e)
      }
    }
    
    // Auto-inject x-tenant-id header if needed
    const tenantId = getCurrentTenantId()
    const shouldInjectTenant = shouldInjectTenantHeader(endpoint)
    
    // Check if body is FormData to handle multipart uploads
    const isFormData = options.body instanceof FormData

    const config: RequestInit = {
      ...options,
      headers: {
        // Don't set Content-Type for FormData - let browser set it with boundary
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(shouldInjectTenant && tenantId ? { 'x-tenant-id': String(tenantId) } : {}),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        // Try to get error details from response body
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch {
          // Response might not be JSON, that's ok
        }
        
        // Log error for telemetry (dev only)
        if ((import.meta as any).env?.DEV) {
          console.error('[HTTP Error]', {
            status: response.status,
            path: endpoint,
            statusText: response.statusText,
            errorData
          })
        }
        
        // Create AppError based on status and context
        throw this.createAppErrorFromResponse(response, endpoint, errorData)
      }

      const responseData = await response.json()
      
      // Intercept successful mutations with meta.code
      if (this.isMutativeMethod(options.method || 'GET') && responseData?.meta?.code) {
        console.log('[HTTP] Intercepting feedback:', {
          method: options.method,
          path: endpoint,
          code: responseData.meta.code,
          message: responseData.meta.message
        })

        const feedbackMessage = resolveFeedbackMessage(
          responseData.meta.code,
          responseData.meta.message,
          { method: options.method || 'GET', path: endpoint }
        )

        console.log('[HTTP] Publishing feedback:', {
          kind: 'success',
          code: responseData.meta.code,
          title: feedbackMessage.title,
          message: feedbackMessage.message,
          path: endpoint
        })

        publishFeedback({
          kind: 'success',
          code: responseData.meta.code,
          title: feedbackMessage.title,
          message: feedbackMessage.message,
          path: endpoint
        })
      }
      
      return responseData
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = createAppError.network()
        networkError.message = getErrorMessage(networkError)
        
        if ((import.meta as any).env?.DEV) {
          console.error('[Network Error]', { path: endpoint, originalError: error })
        }
        
        throw networkError
      }
      
      // If it's already an AppError, just re-throw
      if (isAppError(error)) {
        throw error
      }
      
      // Unknown error - wrap it
      const unknownError = createAppError.unknown((error as any)?.message || 'Unknown error')
      unknownError.message = getErrorMessage(unknownError)
      throw unknownError
    }
  }

  private isMutativeMethod(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
  }


  private createAppErrorFromResponse(response: Response, endpoint: string, errorData?: any): AppError {
    const status = response.status
    const backendCode = errorData?.meta?.code || errorData?.error?.code || errorData?.code
    const backendMessage = errorData?.meta?.message || errorData?.error?.message || errorData?.message
    const fieldErrors = errorData?.error?.details || errorData?.details

    // Auto-publish feedback for known error codes
    if (backendCode && FEEDBACK_CATALOG[backendCode]) {
      const feedbackMessage = resolveFeedbackMessage(
        backendCode,
        backendMessage,
        { method: 'DELETE', path: endpoint }
      )

      publishFeedback({
        kind: 'error',
        code: backendCode,
        title: feedbackMessage.title,
        message: feedbackMessage.message || backendMessage,
        path: endpoint
      })
    }
    
    // Handle expired token - automatic logout
    if (status === 401 && (
      backendMessage?.includes('expired') || 
      backendMessage?.includes('Token expired') ||
      errorData?.error === 'Token expired'
    )) {
      // Clear auth storage and redirect to login
      this.handleExpiredToken()
    }
    
    // Map status to kind and code
    const { kind, code } = mapStatusToErrorCode(status, endpoint, backendCode)
    
    let appError: AppError
    
    // Create appropriate AppError based on kind
    switch (kind) {
      case 'auth':
        appError = createAppError.auth(code, status, endpoint)
        break
      case 'validation':
        appError = createAppError.validation(fieldErrors || {}, backendMessage)
        break
      case 'rate_limit':
        appError = createAppError.rateLimit(status)
        break
      case 'server':
        appError = createAppError.server(status, backendMessage, endpoint)
        break
      case 'network':
        appError = createAppError.network(backendMessage)
        break
      default:
        appError = createAppError.unknown(backendMessage, status)
    }
    
    // Set friendly message from catalog
    appError.message = getErrorMessage(appError)
    
    return appError
  }

  private handleExpiredToken() {
    // Clear localStorage auth data
    localStorage.removeItem('auth-storage')
    
    // Show a notification about the expired session
    publishFeedback({
      kind: 'info',
      code: 'SESSION_EXPIRED',
      title: 'Session expired',
      message: 'Your session has expired. Please sign in again.',
      path: window.location.pathname
    })
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/auth/login'
    }, 1000)
  }

  async get(endpoint: string, options?: { headers?: Record<string, string>, params?: Record<string, any> }) {
    // GET requests handle tenant headers explicitly per endpoint
    // Platform-scoped endpoints (applications) don't need tenant headers
    // Tenant-scoped endpoints (entitlements, users) pass headers explicitly
    return this.request(endpoint, { method: 'GET', headers: options?.headers, params: options?.params })
  }

  async post(endpoint: string, data?: any, headers?: Record<string, string>) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      headers,
    })
  }

  async put(endpoint: string, data?: any, headers?: Record<string, string>) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      headers,
    })
  }

  async patch(endpoint: string, data?: any, headers?: Record<string, string>) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      headers,
    })
  }

  async delete(endpoint: string, headers?: Record<string, string>) {
    return this.request(endpoint, { method: 'DELETE', headers })
  }
}

export const api = new HttpClient()
export const httpConfig = {
  baseURL: API_BASE_URL,
}