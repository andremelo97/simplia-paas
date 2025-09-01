export type AppErrorKind = 
  | 'auth'
  | 'network' 
  | 'rate_limit'
  | 'validation'
  | 'server'
  | 'unknown'

export interface AppError {
  kind: AppErrorKind
  httpStatus?: number
  code?: string
  message: string
  details?: Record<string, string> // Field-level validation errors
  path?: string
}

export interface AppErrorFactory {
  auth(code?: string, httpStatus?: number, path?: string): AppError
  network(message?: string): AppError
  rateLimit(httpStatus?: number): AppError
  validation(details: Record<string, string>, message?: string): AppError
  server(httpStatus?: number, message?: string, path?: string): AppError
  unknown(message?: string, httpStatus?: number): AppError
}

// Type guard to check if an error is an AppError
export function isAppError(error: any): error is AppError {
  return (
    error &&
    typeof error === 'object' &&
    'kind' in error &&
    'message' in error &&
    typeof error.kind === 'string' &&
    typeof error.message === 'string'
  )
}

// Factory functions for creating AppError instances
export const createAppError: AppErrorFactory = {
  auth: (code?: string, httpStatus?: number, path?: string): AppError => ({
    kind: 'auth',
    code,
    httpStatus,
    message: '', // Will be filled by catalog
    path
  }),

  network: (message?: string): AppError => ({
    kind: 'network', 
    message: message || 'Network error'
  }),

  rateLimit: (httpStatus?: number): AppError => ({
    kind: 'rate_limit',
    httpStatus,
    message: '', // Will be filled by catalog
    code: 'RATE_LIMIT'
  }),

  validation: (details: Record<string, string>, message?: string): AppError => ({
    kind: 'validation',
    details,
    message: message || 'Validation error',
    code: 'VALIDATION'
  }),

  server: (httpStatus?: number, message?: string, path?: string): AppError => ({
    kind: 'server',
    httpStatus,
    message: message || 'Server error',
    path,
    code: 'SERVER'
  }),

  unknown: (message?: string, httpStatus?: number): AppError => ({
    kind: 'unknown',
    message: message || 'Unknown error',
    httpStatus,
    code: 'FALLBACK'
  })
}