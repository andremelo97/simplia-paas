/**
 * Utility functions for consistent badge styling across the application
 */

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info'

/**
 * Get consistent badge variant for user roles
 * @param role - User role (admin, manager, operations, etc.)
 * @returns Badge variant
 */
export const getRoleBadgeVariant = (role: string): BadgeVariant => {
  switch (role.toLowerCase()) {
    case 'admin': 
      return 'error'
    case 'manager': 
      return 'warning'
    case 'operations': 
      return 'info'
    default: 
      return 'default'
  }
}

/**
 * Get consistent badge variant for access/granted status
 * @param granted - Whether access is granted
 * @returns Badge variant
 */
export const getAccessBadgeVariant = (granted: boolean): BadgeVariant => {
  return granted ? 'success' : 'default'
}

/**
 * Get consistent text for access status
 * @param granted - Whether access is granted
 * @returns Text to display
 */
export const getAccessBadgeText = (granted: boolean): string => {
  return granted ? 'Granted' : 'Not Granted'
}