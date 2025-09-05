import React from 'react'

export type Status = 'active' | 'inactive' | 'suspended'

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
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
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
    >
      {getStatusLabel(status)}
    </span>
  )
}