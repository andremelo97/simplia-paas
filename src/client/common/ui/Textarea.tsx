import * as React from "react"
import { cn } from '../utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, placeholder, value, rows = 3, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    // Se tem erro e o campo está vazio, mostra o erro como placeholder
    const displayPlaceholder = error && (!value || value === '') ? error : placeholder

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          value={value}
          rows={rows}
          placeholder={displayPlaceholder}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all resize-vertical focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-300 focus-visible:border-red-500 placeholder:text-red-400",
            !error && "focus-visible:border-[var(--brand-primary)] placeholder:text-gray-400",
            className
          )}
          style={{
            borderRadius: '4px',
            padding: '6px'
          }}
          ref={ref}
          {...props}
        />
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
Textarea.displayName = "Textarea"

export { Textarea }