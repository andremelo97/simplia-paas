import { FeedbackCatalog, AppError, AppErrorKind } from './types'
import i18next from 'i18next'

// Helper function to get translated feedback message
function getTranslatedFeedback(code: string): { title?: string; message: string } | null {
  const key = `common:feedback.${code}`

  // Check if translation exists
  if (i18next.exists(`${key}.title`) && i18next.exists(`${key}.message`)) {
    return {
      title: i18next.t(`${key}.title`),
      message: i18next.t(`${key}.message`)
    }
  }

  return null
}

export const FEEDBACK_CATALOG: FeedbackCatalog = {
  // Tenant operations
  TENANT_CREATED: {
    title: "Tenant Created",
    message: "Tenant created successfully."
  },
  TENANT_UPDATED: {
    title: "Tenant Updated", 
    message: "Tenant updated successfully."
  },
  TENANT_DELETED: {
    title: "Tenant Deleted",
    message: "Tenant deleted successfully."
  },

  // License operations
  LICENSE_ACTIVATED: {
    title: "License Activated",
    message: "License activated successfully."
  },
  LICENSE_ADJUSTED: {
    title: "License Adjusted",
    message: "License adjusted successfully."
  },

  // User operations
  USER_CREATED: {
    title: "User Created",
    message: "User created successfully."
  },
  USER_UPDATED: {
    title: "User Updated",
    message: "User updated successfully."
  },
  USER_DELETED: {
    title: "User Deleted",
    message: "User deleted successfully."
  },
  USER_DEACTIVATED: {
    title: "User Deactivated",
    message: "User deactivated successfully."
  },
  ROLE_IN_APP_UPDATED: {
    title: "Role Updated",
    message: "User role in application updated successfully."
  },

  // Address operations
  ADDRESS_CREATED: {
    title: "Address Added",
    message: "Address added successfully."
  },
  ADDRESS_UPDATED: {
    title: "Address Updated",
    message: "Address updated successfully."
  },
  ADDRESS_DELETED: {
    title: "Address Removed",
    message: "Address removed."
  },

  // Contact operations
  CONTACT_CREATED: {
    title: "Contact Added",
    message: "Contact added successfully."
  },
  CONTACT_UPDATED: {
    title: "Contact Updated",
    message: "Contact updated successfully."
  },
  CONTACT_DELETED: {
    title: "Contact Removed",
    message: "Contact removed."
  },

  // Communication settings
  COMMUNICATION_SETTINGS_SAVED: {
    title: "Communication Updated",
    message: "Communication settings saved successfully."
  },

  // Public quote operations
  PUBLIC_QUOTE_EMAIL_FAILED: {
    title: "Email Delivery Failed",
    message: "Failed to send public quote email."
  },
  PUBLIC_QUOTE_CREATION_FAILED: {
    title: "Link Creation Failed",
    message: "Failed to create public quote link."
  },
  PUBLIC_QUOTE_NEW_PASSWORD_FAILED: {
    title: "Password Update Failed",
    message: "Failed to generate new public quote password."
  },
  NEW_PASSWORD_GENERATED: {
    title: "Password Updated",
    message: "New password generated successfully."
  },

  // Pricing operations
  PRICING_CREATED: {
    title: "Pricing Created",
    message: "Pricing created successfully."
  },
  PRICING_UPDATED: {
    title: "Pricing Updated", 
    message: "Pricing updated successfully."
  },
  PRICING_ENDED: {
    title: "Period Ended",
    message: "Pricing period ended successfully."
  },

  // Authentication operations
  LOGIN_SUCCESS: {
    title: "Welcome Back",
    message: "Signed in successfully."
  },
  AUTH_INVALID_CREDENTIALS: {
    title: "Authentication Failed",
    message: "Incorrect email or password."
  },
  AUTH_RATE_LIMITED: {
    title: "Too Many Attempts",
    message: "Too many attempts. Please wait and try again."
  },
  AUTH_LOCKED: {
    title: "Account Locked",
    message: "Your account is locked. Contact the administrator."
  },
  AUTH_NETWORK_FAILURE: {
    title: "Connection Error",
    message: "Can't reach the server. Check your connection and try again."
  },
  SESSION_EXPIRED: {
    title: "Session Expired",
    message: "Your session has expired. Please sign in again."
  },

  // TQ - Quote operations
  QUOTE_CREATED: {
    title: "Quote Created",
    message: "Quote created successfully."
  },
  QUOTE_UPDATED: {
    title: "Quote Updated",
    message: "Quote updated successfully."
  },
  QUOTE_DELETED: {
    title: "Quote Deleted",
    message: "Quote deleted successfully."
  },

  // TQ - Session operations
  SESSION_CREATED: {
    title: "Session Created",
    message: "Session created successfully."
  },
  SESSION_UPDATED: {
    title: "Session Updated",
    message: "Session updated successfully."
  },
  SESSION_DELETED: {
    title: "Session Deleted",
    message: "Session deleted successfully."
  },

  // TQ - Patient operations
  PATIENT_CREATED: {
    title: "Patient Created",
    message: "Patient created successfully."
  },
  PATIENT_UPDATED: {
    title: "Patient Updated",
    message: "Patient updated successfully."
  },
  PATIENT_DELETED: {
    title: "Patient Deleted",
    message: "Patient deleted successfully."
  },

  // TQ - Template operations
  TEMPLATE_CREATED: {
    title: "Template Created",
    message: "Template created successfully."
  },
  TEMPLATE_UPDATED: {
    title: "Template Updated",
    message: "Template updated successfully."
  },
  TEMPLATE_DELETED: {
    title: "Template Deleted",
    message: "Template deleted successfully."
  },
  TEMPLATE_FILLED: {
    title: "Template Filled",
    message: "Template filled successfully with AI."
  },

  // TQ - Quote Items operations
  QUOTE_ITEMS_UPDATED: {
    title: "Items Updated",
    message: "Quote items updated successfully."
  },

  // TQ - Public Quote operations
  PUBLIC_QUOTE_CREATED: {
    title: "Public Quote Created",
    message: "Public quote link created successfully!"
  },
  PUBLIC_QUOTE_REVOKED: {
    title: "Link Revoked",
    message: "Public quote link has been revoked successfully."
  },
  PUBLIC_QUOTE_NOT_FOUND: {
    title: "Not Found",
    message: "Public quote link not found."
  },
  LOAD_FAILED: {
    title: "Load Failed",
    message: "Failed to load data. Please try again."
  },
  REVOKE_FAILED: {
    title: "Revoke Failed",
    message: "Failed to revoke link. Please try again."
  },

  // TQ - Public Quote Template operations
  PUBLIC_QUOTE_TEMPLATE_CREATED: {
    title: "Template Created",
    message: "Public quote template created successfully."
  },
  PUBLIC_QUOTE_TEMPLATE_UPDATED: {
    title: "Template Updated",
    message: "Public quote template updated successfully."
  },
  PUBLIC_QUOTE_TEMPLATE_DELETED: {
    title: "Template Deleted",
    message: "Public quote template deleted successfully."
  },

  // Branding operations
  BRANDING_UPDATED: {
    title: "Branding Updated",
    message: "Branding configuration updated successfully."
  },
  BRANDING_RESET: {
    title: "Branding Reset",
    message: "Branding configuration reset to defaults."
  },
  LOGO_UPLOADED: {
    title: "Logo Uploaded",
    message: "Logo uploaded successfully."
  },
  FAVICON_UPLOADED: {
    title: "Favicon Uploaded",
    message: "Favicon uploaded successfully."
  },

  // SMTP operations
  SMTP_SETTINGS_SAVED: {
    title: "SMTP Settings Saved",
    message: "Email configuration saved successfully."
  },
  SMTP_SETTINGS_RETRIEVED: {
    title: "Settings Loaded",
    message: "SMTP settings loaded successfully."
  },

  // Email Template operations
  EMAIL_TEMPLATE_RETRIEVED: {
    title: "Template Loaded",
    message: "Email template loaded successfully."
  },
  EMAIL_TEMPLATE_UPDATED: {
    title: "Template Updated",
    message: "Email template updated successfully."
  },
  EMAIL_TEMPLATE_RESET: {
    title: "Template Reset",
    message: "Email template reset to default successfully."
  }
}

// Fallback messages by method + route
export const FALLBACK_MESSAGES: Record<string, string> = {
  'POST /tenants': 'Tenant created successfully.',
  'PUT /tenants': 'Tenant updated successfully.',
  'DELETE /tenants': 'Tenant deleted successfully.',
  'POST /users': 'User created successfully.',
  'PUT /users': 'User updated successfully.',
  'DELETE /users': 'User deleted successfully.',
  'POST /addresses': 'Address added successfully.',
  'PUT /addresses': 'Address updated successfully.',
  'DELETE /addresses': 'Address removed.',
  'POST /contacts': 'Contact added successfully.',
  'PUT /contacts': 'Contact updated successfully.',
  'DELETE /contacts': 'Contact removed.'
}

export function resolveFeedbackMessage(
  code: string,
  fallbackMessage?: string,
  context?: { method: string; path: string }
): { title?: string; message: string } {
  // First, try to get translated message from i18next
  const translatedFeedback = getTranslatedFeedback(code)
  if (translatedFeedback) {
    return translatedFeedback
  }

  // Second, try catalog by code (hardcoded fallback for non-TQ apps)
  const catalogEntry = FEEDBACK_CATALOG[code]
  if (catalogEntry) {
    return catalogEntry
  }

  // Third, use fallback provided by backend
  if (fallbackMessage) {
    return { message: fallbackMessage }
  }

  // Fourth, use fallback by method + route
  if (context) {
    const routeKey = `${context.method} ${context.path.split('?')[0]}`
    const fallback = FALLBACK_MESSAGES[routeKey]
    if (fallback) {
      return { message: fallback }
    }
  }

  // Last resort
  return { message: 'Operation completed successfully.' }
}

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
