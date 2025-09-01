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

    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
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