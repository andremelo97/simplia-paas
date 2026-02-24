import React from 'react'
import { SimpleEditor } from '@shared/components/tiptap-templates/simple/simple-editor'
import { cn } from '../utils/cn'
import { FormFieldWrapper } from './FormFieldWrapper'

interface TemplateEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  readonly?: boolean
  minHeight?: string
  className?: string
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  requiredMessage?: string
  showRequiredHint?: boolean
}

export const isEditorContentFilled = (html?: string | null): boolean => {
  if (!html) {
    return false
  }

  const sanitized = html
    .replace(/<p><br><\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()

  return sanitized.length > 0
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  content,
  onChange,
  placeholder = "Create your template using [placeholders], $variables$, and (instructions)...",
  readonly = false,
  minHeight = "25rem",
  className,
  label,
  error,
  helperText,
  required,
  requiredMessage,
  showRequiredHint
}) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(() => isEditorContentFilled(content))

  React.useEffect(() => {
    setHasValue(isEditorContentFilled(content))
  }, [content])

  const handleEditorChange = React.useCallback(
    (value: string) => {
      onChange(value)
      setHasValue(isEditorContentFilled(value))
    },
    [onChange]
  )

  const handleFocusCapture = React.useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlurCapture = React.useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setIsFocused(false)
    }
  }, [])

  const hasError = Boolean(error)
  const shouldShowRequiredState =
    Boolean(required) && !hasValue && (isFocused || Boolean(showRequiredHint) || hasError)
  const displayRequiredHint =
    Boolean(required) && !hasValue && (isFocused || Boolean(showRequiredHint)) && !hasError

  return (
    <FormFieldWrapper
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      requiredHint={requiredMessage}
      showRequiredHint={displayRequiredHint}
      className={className}
    >
      <div
        className={cn(
          "template-editor-constrained",
          (hasError || shouldShowRequiredState) && "template-editor--invalid"
        )}
        style={{ minHeight }}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
      >
        <SimpleEditor
          content={content}
          onChange={handleEditorChange}
          placeholder={placeholder}
          readonly={readonly}
        />
      </div>
    </FormFieldWrapper>
  )
}

export default TemplateEditor
