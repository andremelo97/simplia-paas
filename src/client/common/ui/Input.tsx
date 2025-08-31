import * as React from "react"
import { cn } from '../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, placeholder, value, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    // Se tem erro e o campo está vazio, mostra o erro como placeholder
    const displayPlaceholder = error && (!value || value === '') ? error : placeholder

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          value={value}
          placeholder={displayPlaceholder}
          className={cn(
            "flex h-12 w-full rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:border-blue-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-300 focus-visible:ring-red-500 placeholder:text-red-400",
            !error && "placeholder:text-gray-400",
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
        />
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }