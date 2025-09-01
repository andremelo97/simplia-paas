import { AppError, createAppError, isAppError } from '../apps/internal-admin/services/errors/types'
import { mapStatusToErrorCode, getErrorMessage } from '../apps/internal-admin/services/errors/catalog'

// HTTP client configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

class HttpClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
        if (import.meta.env.DEV) {
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

      return response.json()
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = createAppError.network()
        networkError.message = getErrorMessage(networkError)
        
        if (import.meta.env.DEV) {
          console.error('[Network Error]', { path: endpoint, originalError: error })
        }
        
        throw networkError
      }
      
      // If it's already an AppError, just re-throw
      if (isAppError(error)) {
        throw error
      }
      
      // Unknown error - wrap it
      const unknownError = createAppError.unknown(error.message)
      unknownError.message = getErrorMessage(unknownError)
      throw unknownError
    }
  }

  private createAppErrorFromResponse(response: Response, endpoint: string, errorData?: any): AppError {
    const status = response.status
    const backendCode = errorData?.error?.code || errorData?.code
    const backendMessage = errorData?.error?.message || errorData?.message
    const fieldErrors = errorData?.error?.details || errorData?.details
    
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

  async get(endpoint: string, headers?: Record<string, string>) {
    return this.request(endpoint, { method: 'GET', headers })
  }

  async post(endpoint: string, data?: any, headers?: Record<string, string>) {
    // Don't send tenant header for platform auth endpoints
    const finalHeaders = endpoint.includes('/platform-auth/') 
      ? (headers || {})
      : { 'x-tenant-id': 'default', ...(headers || {}) }
    
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: finalHeaders,
    })
  }

  async put(endpoint: string, data?: any, headers?: Record<string, string>) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
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