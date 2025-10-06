import React from 'react'

export type Status = 'active' | 'inactive' | 'suspended' | 'revoked' | 'expired'

export interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
  className?: string
  ariaLabel?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'sm',
  className = '',
  ariaLabel 
}) => {
  const getStatusStyles = (status: Status) => {
    switch (status) {
      case 'active':
        return ''
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
      case 'revoked':
        return 'bg-gray-100 text-gray-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'suspended':
        return 'Suspended'
      case 'revoked':
        return 'Revoked'
      case 'expired':
        return 'Expired'
      default:
        return status
    }
  }

  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'

  return (
    <span
      className={`inline-flex ${sizeClasses} font-semibold rounded-full ${getStatusStyles(status)} ${className}`}
      role="status"
      aria-label={ariaLabel || `Status: ${getStatusLabel(status)}`}
      aria-live="polite"
      style={status === 'active' ? { 
        color: 'var(--brand-tertiary)',
        backgroundColor: 'var(--brand-tertiary-bg)',
        fontFamily: 'Montserrat, sans-serif' 
      } : undefined}
    >
      {getStatusLabel(status)}
    </span>
  )
}