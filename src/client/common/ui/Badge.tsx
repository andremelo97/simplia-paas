import * as React from "react"
import { cn } from '../utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-indigo-100 text-indigo-800', 
      secondary: 'bg-purple-100 text-purple-800',
      tertiary: '',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800'
    }

    const sizeClasses = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm'
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        style={variant === 'tertiary' ? { 
          color: 'var(--brand-tertiary)',
          backgroundColor: 'var(--brand-tertiary-bg)', 
          fontFamily: 'Inter, sans-serif' 
        } : variant === 'success' ? {
          color: 'var(--brand-tertiary)',
          backgroundColor: 'var(--brand-tertiary-bg)',
          fontFamily: 'Inter, sans-serif'
        } : undefined}
        {...props}
      />
    )
  }
)

Badge.displayName = "Badge"

export { Badge }