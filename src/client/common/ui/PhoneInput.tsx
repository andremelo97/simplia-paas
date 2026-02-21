import * as React from "react"
import { cn } from '../utils/cn'
import { FormFieldWrapper } from './FormFieldWrapper'

const COUNTRIES = [
  { code: '55', flag: '\u{1F1E7}\u{1F1F7}', label: 'BR +55' },
  { code: '61', flag: '\u{1F1E6}\u{1F1FA}', label: 'AU +61' },
]

export interface PhoneInputProps {
  phoneValue: string
  countryCodeValue: string
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCountryCodeChange: (code: string) => void
  label?: string
  error?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(({
  phoneValue,
  countryCodeValue,
  onPhoneChange,
  onCountryCodeChange,
  label,
  error,
  helperText,
  disabled,
  required,
  placeholder,
}, ref) => {
  const inputId = label?.toLowerCase().replace(/\s+/g, '-')
  const hasError = Boolean(error)
  const hasValue = phoneValue.trim().length > 0

  const showErrorAsPlaceholder = hasError && !hasValue
  const displayPlaceholder = showErrorAsPlaceholder ? error : placeholder

  const selectedCountry = COUNTRIES.find(c => c.code === countryCodeValue) || COUNTRIES[0]

  return (
    <FormFieldWrapper
      id={inputId}
      label={label}
      required={required}
      error={showErrorAsPlaceholder ? undefined : error}
      helperText={helperText}
    >
      <div className="group/phone flex">
        <select
          value={countryCodeValue}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "peer/select h-8 rounded-l border border-r-0 border-gray-200 bg-gray-50 px-1.5 text-sm shadow-sm transition-all focus:outline-none focus:border-[#B725B7] disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-red-300"
          )}
          style={{ width: '88px' }}
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} +{country.code}
            </option>
          ))}
        </select>
        <input
          ref={ref}
          type="tel"
          id={inputId}
          value={phoneValue}
          onChange={onPhoneChange}
          disabled={disabled}
          required={required}
          placeholder={displayPlaceholder}
          className={cn(
            "flex h-8 w-full rounded-r border border-gray-200 bg-white/70 px-1.5 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 peer-focus/select:border-l-[#B725B7]",
            hasError && "border-red-300 focus-visible:border-red-500 placeholder:text-red-400 peer-focus/select:border-l-red-500",
            !hasError && "focus:border-[#B725B7] focus-visible:border-[#B725B7] placeholder:text-gray-400"
          )}
        />
      </div>
    </FormFieldWrapper>
  )
})
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
