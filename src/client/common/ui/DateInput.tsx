import * as React from "react"
import { useTranslation } from 'react-i18next'
import { Calendar, X } from 'lucide-react'
import { cn } from '../utils/cn'

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * Format an ISO date string (YYYY-MM-DD) into locale display format.
 * pt-BR: DD/MM/YYYY
 * en-US: MM/DD/YYYY
 */
function formatDateForDisplay(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return ''
  const parts = isoDate.split('-')
  if (parts.length !== 3) return ''
  const [y, m, d] = parts
  if (!y || !m || !d) return ''
  if (locale.startsWith('pt')) return `${d}/${m}/${y}`
  return `${m}/${d}/${y}`
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, helperText, id, value, onChange, disabled, min, max, ...props }, ref) => {
    const { i18n } = useTranslation()
    const locale = i18n.language || 'en-US'
    const hiddenDateRef = React.useRef<HTMLInputElement>(null)
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const placeholder = locale.startsWith('pt') ? 'dd/mm/aaaa' : 'mm/dd/yyyy'
    const displayValue = formatDateForDisplay(value as string, locale)

    const handleOpenPicker = () => {
      if (disabled) return
      try {
        hiddenDateRef.current?.showPicker()
      } catch {
        hiddenDateRef.current?.focus()
        hiddenDateRef.current?.click()
      }
    }

    const handleHiddenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled) return
      if (onChange) {
        const syntheticEvent = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

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
        <div className="relative">
          {/* Hidden native date input for the picker */}
          <input
            type="date"
            ref={hiddenDateRef}
            id={inputId}
            value={(value as string) || ''}
            onChange={handleHiddenChange}
            min={min as string}
            max={max as string}
            disabled={disabled}
            tabIndex={-1}
            className="sr-only"
            aria-hidden="true"
          />

          {/* Visible styled display */}
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={handleOpenPicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleOpenPicker()
              }
            }}
            className={cn(
              "flex items-center w-full rounded-md border border-gray-200 bg-white/70 text-sm shadow-sm transition-all hover:bg-white/90 cursor-pointer select-none",
              error && "border-red-300",
              !error && "focus:border-[var(--brand-primary)] focus:outline-none",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
            style={{
              height: '2rem',
              minHeight: '2rem',
              borderRadius: '0.25rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            <span className={cn("flex-1 truncate", !displayValue && "text-gray-400")}>
              {displayValue || placeholder}
            </span>

            {/* Clear button */}
            {displayValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label="Clear date"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Calendar icon */}
            <Calendar className="w-4 h-4 ml-1 flex-shrink-0 text-gray-400" />
          </div>
        </div>
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
