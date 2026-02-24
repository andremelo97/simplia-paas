import * as React from "react"
import { DollarSign } from 'lucide-react'
import { cn } from '../utils/cn'
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter'

export interface PriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  value?: number
  onChange?: (value: number) => void
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ className, label, error, helperText, id, placeholder = "0.00", value, onChange, disabled, ...props }, ref) => {
    const { getCurrencySymbol, getCurrency } = useCurrencyFormatter()
    const currencySymbol = getCurrencySymbol()
    const currency = getCurrency()
    const isBrazil = currency === 'BRL'
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const [displayValue, setDisplayValue] = React.useState('')
    const isTypingRef = React.useRef(false)

    // Initialize display value from prop — only when not actively typing
    React.useEffect(() => {
      if (isTypingRef.current) return
      if (value !== undefined && value !== null && value !== 0) {
        const numValue = typeof value === 'number' ? value : parseFloat(value as any)
        setDisplayValue(numValue.toFixed(2))
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Allow only numbers and one decimal point
      const regex = /^\d*\.?\d*$/
      if (regex.test(inputValue) || inputValue === '') {
        isTypingRef.current = true
        setDisplayValue(inputValue)

        if (onChange) {
          const numericValue = inputValue === '' ? 0 : parseFloat(inputValue)
          onChange(isNaN(numericValue) ? 0 : numericValue)
        }
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isTypingRef.current = false
      // Format to 2 decimal places on blur
      if (displayValue !== '') {
        const numValue = parseFloat(displayValue)
        if (!isNaN(numValue)) {
          setDisplayValue(numValue.toFixed(2))
        }
      }
      props.onBlur?.(e)
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
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center gap-1 pointer-events-none">
            {isBrazil ? (
              // Brazil: Show only R$ text, no icon
              <span className="text-xs text-gray-500">{currencySymbol}</span>
            ) : (
              // USD: Show only $ icon, no text
              <DollarSign className="h-3 w-3 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            inputMode="decimal"
            id={inputId}
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            ref={ref}
            className={cn(
              "flex h-12 w-full rounded-md border border-gray-200 bg-white/70 pl-8 pr-3 py-2 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-300 focus-visible:border-red-500 placeholder:text-red-400",
              !error && "focus:border-[#B725B7] focus-visible:border-[#B725B7]",
              className
            )}
            style={{
              height: '2rem',
              minHeight: '2rem',
              borderRadius: '0.25rem',
              padding: '0.25rem 0.375rem 0.25rem 1.75rem'
            }}
            {...props}
          />
        </div>
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

PriceInput.displayName = "PriceInput"

export { PriceInput }