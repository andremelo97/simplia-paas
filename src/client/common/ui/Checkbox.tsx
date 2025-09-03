import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@client/common/utils/cn'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id || React.useId()
    
    return (
      <div className="flex items-start space-x-2">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            className="sr-only"
            id={checkboxId}
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              "flex h-4 w-4 shrink-0 rounded-sm border border-gray-300 transition-colors",
              "focus-within:ring-2 focus-within:ring-[var(--brand-primary)] focus-within:ring-offset-1",
              "hover:border-gray-400",
              props.checked && "border-[var(--brand-primary)]",
              props.disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            style={{
              backgroundColor: props.checked ? 'var(--brand-primary)' : undefined
            }}
          >
            {props.checked && (
              <Check className="h-3 w-3 text-white m-0.5" strokeWidth={3} />
            )}
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex flex-col space-y-1">
            {label && (
              <label 
                htmlFor={checkboxId}
                className={cn(
                  "text-sm font-medium leading-none cursor-pointer",
                  props.disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn(
                "text-xs text-gray-600",
                props.disabled && "opacity-50"
              )}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'