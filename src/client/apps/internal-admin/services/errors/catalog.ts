import { AppError, AppErrorKind } from './types'

// English message catalog for friendly error display
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: "Incorrect email or password.",
  USER_DISABLED: "Your account is disabled. Please contact support.",
  PASSWORD_EXPIRED: "Your password has expired. Please reset it.",
  FORBIDDEN: "You don't have permission to access this resource.",
  
  // Validation errors  
  VALIDATION: "Please check the highlighted fields.",
  
  // Rate limiting
  RATE_LIMIT: "Too many attempts. Please wait a moment and try again.",
  
  // Network errors
  NETWORK: "Can't reach the server. Check your connection and try again.",
  
  // Server errors
  SERVER: "We're having issues right now. Please try again later.",
  
  // Fallback
  FALLBACK: "Something went wrong. Please try again."
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES

// Map error details to friendly message
export function getErrorMessage(error: AppError): string {
  // If we have a specific code, use it
  if (error.code && error.code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error.code as ErrorCode]
  }
  
  // Fall back to kind-based mapping
  switch (error.kind) {
    case 'auth':
      return ERROR_MESSAGES.INVALID_CREDENTIALS
    case 'network':
      return ERROR_MESSAGES.NETWORK
    case 'rate_limit':
      return ERROR_MESSAGES.RATE_LIMIT
    case 'validation':
      return ERROR_MESSAGES.VALIDATION
    case 'server':
      return ERROR_MESSAGES.SERVER
    case 'unknown':
    default:
      return ERROR_MESSAGES.FALLBACK
  }
}

// Map HTTP status and context to AppError code
export function mapStatusToErrorCode(
  status: number, 
  path?: string,
  backendCode?: string
): { kind: AppErrorKind; code?: string } {
  
  // If backend provided a specific code, use it
  if (backendCode) {
    // Validate it's a known code
    if (backendCode in ERROR_MESSAGES) {
      return { 
        kind: getKindForCode(backendCode as ErrorCode),
        code: backendCode 
      }
    }
  }
  
  // Map by HTTP status
  switch (status) {
    case 401:
      if (path?.includes('/auth/login')) {
        return { kind: 'auth', code: 'INVALID_CREDENTIALS' }
      }
      return { kind: 'auth', code: 'INVALID_CREDENTIALS' }
    
    case 403:
      return { kind: 'auth', code: 'FORBIDDEN' }
    
    case 404:
      if (path?.includes('/auth/login')) {
        // Login endpoint not found suggests server issues
        return { kind: 'server', code: 'SERVER' }
      }
      return { kind: 'unknown', code: 'FALLBACK' }
    
    case 422:
      return { kind: 'validation', code: 'VALIDATION' }
    
    case 429:
      return { kind: 'rate_limit', code: 'RATE_LIMIT' }
    
    case 500:
    case 502:
    case 503:
    case 504:
      return { kind: 'server', code: 'SERVER' }
    
    default:
      if (status >= 500) {
        return { kind: 'server', code: 'SERVER' }
      }
      return { kind: 'unknown', code: 'FALLBACK' }
  }
}

// Map error code to appropriate kind
function getKindForCode(code: ErrorCode): AppErrorKind {
  switch (code) {
    case 'INVALID_CREDENTIALS':
    case 'USER_DISABLED':
    case 'PASSWORD_EXPIRED':
    case 'FORBIDDEN':
      return 'auth'
    
    case 'VALIDATION':
      return 'validation'
    
    case 'RATE_LIMIT':
      return 'rate_limit'
    
    case 'NETWORK':
      return 'network'
    
    case 'SERVER':
      return 'server'
    
    case 'FALLBACK':
    default:
      return 'unknown'
  }
}

// Check if error kind should show as banner (vs field-level)
export function shouldShowAsBanner(kind: AppErrorKind): boolean {
  return ['auth', 'server', 'network', 'rate_limit', 'unknown'].includes(kind)
}

// Check if error kind should show field-level errors
export function shouldShowFieldErrors(kind: AppErrorKind): boolean {
  return kind === 'validation'
}