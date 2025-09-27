import * as React from "react"
import { DollarSign } from 'lucide-react'
import { cn } from '../utils/cn'

export interface PriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  value?: number
  onChange?: (value: number) => void
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ className, label, error, helperText, id, placeholder = "0.00", value, onChange, disabled, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const [displayValue, setDisplayValue] = React.useState('')

    // Initialize display value
    React.useEffect(() => {
      if (value !== undefined && value !== null && value !== 0) {
        setDisplayValue(value.toString())
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Allow only numbers and one decimal point
      const regex = /^\d*\.?\d*$/
      if (regex.test(inputValue) || inputValue === '') {
        setDisplayValue(inputValue)

        if (onChange) {
          const numericValue = inputValue === '' ? 0 : parseFloat(inputValue)
          onChange(isNaN(numericValue) ? 0 : numericValue)
        }
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
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <DollarSign className="h-3 w-3 text-gray-400" />
          </div>
          <input
            type="text"
            inputMode="decimal"
            id={inputId}
            value={displayValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            ref={ref}
            className={cn(
              "flex h-12 w-full rounded-md border border-gray-200 bg-white/70 pl-10 pr-3 py-2 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-300 focus-visible:border-red-500 placeholder:text-red-400",
              !error && "focus:border-[#B725B7] focus-visible:border-[#B725B7]",
              className
            )}
            style={{
              height: '32px',
              minHeight: '32px',
              borderRadius: '4px',
              padding: '4px 6px 4px 24px'
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