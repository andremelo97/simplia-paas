import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'
import { FieldError } from './FieldError'

interface FormFieldWrapperProps {
  id?: string
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  requiredHint?: string
  showRequiredHint?: boolean
  className?: string
  children: React.ReactNode
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  id,
  label,
  required,
  error,
  helperText,
  requiredHint,
  showRequiredHint,
  className,
  children
}) => {
  const { t } = useTranslation('common')
  const hintMessage = requiredHint || t('field_required', 'This field is mandatory')
  const hasError = Boolean(error)
  const showHint = Boolean(required) && Boolean(showRequiredHint) && !hasError

  return (
    <div className={cn('w-full space-y-1', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {hasError ? (
        <FieldError error={error} />
      ) : showHint ? (
        <p className="text-sm text-red-600">{hintMessage}</p>
      ) : helperText ? (
        <p className="text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  )
}
