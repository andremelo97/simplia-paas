import * as React from "react"
import { cn } from '../utils/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, placeholder, value, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          value={value}
          className={cn(
            "flex h-12 w-full rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-300 focus-visible:border-red-500",
            !error && "focus-visible:border-[var(--brand-primary)]",
            className
          )}
          style={{
            height: '32px',
            minHeight: '32px',
            borderRadius: '4px',
            padding: '4px 6px'
          }}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }