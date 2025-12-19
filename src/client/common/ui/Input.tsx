import * as React from "react"
import { cn } from '../utils/cn'
import { FormFieldWrapper } from './FormFieldWrapper'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  requiredMessage?: string
  showRequiredHint?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    className,
    type = 'text',
    label,
    error,
    helperText,
    id,
    placeholder,
    value,
    defaultValue,
    required,
    requiredMessage,
    showRequiredHint,
    onFocus,
    onBlur,
    ...rest
  } = props

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const [isFocused, setIsFocused] = React.useState(false)

  const hasValue = (() => {
    const currentValue = value ?? defaultValue

    if (currentValue === undefined || currentValue === null) {
      return false
    }

    if (typeof currentValue === 'string') {
      return currentValue.trim().length > 0
    }

    if (typeof currentValue === 'number') {
      return !Number.isNaN(currentValue)
    }

    if (Array.isArray(currentValue)) {
      return currentValue.length > 0
    }

    return true
  })()

  const hasError = Boolean(error)
  const shouldShowRequiredState =
    Boolean(required) && !hasValue && (isFocused || Boolean(showRequiredHint) || hasError)
  const displayRequiredHint =
    Boolean(required) && !hasValue && (isFocused || Boolean(showRequiredHint)) && !hasError

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    onFocus?.(event)
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    onBlur?.(event)
  }

  // Se tem erro e o campo esta vazio, mostra o erro como placeholder (não duplicar abaixo)
  const showErrorAsPlaceholder = hasError && !hasValue
  const displayPlaceholder = showErrorAsPlaceholder ? error : placeholder

  return (
    <FormFieldWrapper
      id={inputId}
      label={label}
      required={required}
      error={showErrorAsPlaceholder ? undefined : error}
      helperText={helperText}
      requiredHint={requiredMessage}
      showRequiredHint={displayRequiredHint}
    >
      <input
        type={type}
        id={inputId}
        value={value}
        defaultValue={defaultValue}
        required={required}
        placeholder={displayPlaceholder}
        className={cn(
          "flex h-12 w-full rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50",
          (hasError || shouldShowRequiredState) && "border-red-300 focus-visible:border-red-500 placeholder:text-red-400",
          !hasError && !shouldShowRequiredState && "focus:border-[#B725B7] focus-visible:border-[#B725B7] placeholder:text-gray-400",
          className
        )}
        style={{
          height: '32px',
          minHeight: '32px',
          borderRadius: '4px',
          padding: '4px 6px'
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={ref}
        {...rest}
      />
    </FormFieldWrapper>
  )
})
Input.displayName = "Input"

export { Input }
