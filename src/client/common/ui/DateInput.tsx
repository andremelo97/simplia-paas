import * as React from "react"
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, helperText, id, lang, ...props }, ref) => {
    const { i18n } = useTranslation()
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const inputLang = lang || i18n.language || 'en-US'

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
          type="date"
          id={inputId}
          lang={inputLang}
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
            padding: '4px 8px'
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
DateInput.displayName = "DateInput"

export { DateInput }
