import * as React from "react"
import { cn } from '../utils/cn'
import { FormFieldWrapper } from './FormFieldWrapper'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  requiredMessage?: string
  showRequiredHint?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const {
    className,
    label,
    error,
    helperText,
    id,
    placeholder,
    value,
    defaultValue,
    rows = 3,
    required,
    requiredMessage,
    showRequiredHint,
    onFocus,
    onBlur,
    ...rest
  } = props

  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
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

  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true)
    onFocus?.(event)
  }

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false)
    onBlur?.(event)
  }

  // Se tem erro e o campo esta vazio, mostra o erro como placeholder
  const displayPlaceholder = hasError && !hasValue ? error : placeholder

  return (
    <FormFieldWrapper
      id={textareaId}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      requiredHint={requiredMessage}
      showRequiredHint={displayRequiredHint}
    >
      <textarea
        id={textareaId}
        value={value}
        defaultValue={defaultValue}
        required={required}
        rows={rows}
        placeholder={displayPlaceholder}
        className={cn(
          "flex min-h-[5rem] w-full rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-all resize-vertical focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50",
          (hasError || shouldShowRequiredState) && "border-red-300 focus-visible:border-red-500 placeholder:text-red-400",
          !hasError && !shouldShowRequiredState && "focus-visible:border-[var(--brand-primary)] placeholder:text-gray-400",
          className
        )}
        style={{
          borderRadius: '0.25rem',
          padding: '0.375rem'
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={ref}
        {...rest}
      />
    </FormFieldWrapper>
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
