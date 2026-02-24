import * as React from "react"
import { X } from 'lucide-react'
import { cn } from '../utils/cn'
import { FormFieldWrapper } from './FormFieldWrapper'

export interface TagInputProps {
  label?: string
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  helperText?: string
  error?: string
  validateTag?: (tag: string) => boolean
  id?: string
  required?: boolean
  disabled?: boolean
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const {
    label,
    value = [],
    onChange,
    placeholder,
    helperText,
    error,
    validateTag,
    id,
    required,
    disabled
  } = props

  const [inputValue, setInputValue] = React.useState('')
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()

    if (!trimmedTag) return

    // Check for duplicates
    if (value.includes(trimmedTag)) {
      setInputValue('')
      return
    }

    // Validate if validator provided
    if (validateTag && !validateTag(trimmedTag)) {
      return
    }

    onChange([...value, trimmedTag])
    setInputValue('')
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')

    // Check if pasted text contains commas or semicolons (multiple emails)
    if (pastedText.includes(',') || pastedText.includes(';')) {
      e.preventDefault()
      const tags = pastedText.split(/[,;]/).map(t => t.trim()).filter(Boolean)
      const validTags = tags.filter(tag => {
        const trimmedTag = tag.toLowerCase()
        if (value.includes(trimmedTag)) return false
        if (validateTag && !validateTag(trimmedTag)) return false
        return true
      })
      if (validTags.length > 0) {
        onChange([...value, ...validTags.map(t => t.toLowerCase())])
      }
    }
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  const hasError = Boolean(error)

  return (
    <FormFieldWrapper
      id={inputId}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <div
        onClick={handleContainerClick}
        className={cn(
          "flex flex-wrap gap-2 min-h-[2rem] w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1.5 text-sm shadow-sm transition-all hover:bg-white/90",
          hasError && "border-red-300 focus-within:border-red-500",
          !hasError && "focus-within:border-[#B725B7]",
          disabled && "cursor-not-allowed opacity-50"
        )}
        style={{
          borderRadius: '0.25rem'
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, #B725B7 0%, #E91E63 100%)'
            }}
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                className="ml-0.5 rounded-full hover:bg-white/20 p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          id={inputId}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue)
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-[7.5rem] bg-transparent outline-none placeholder:text-gray-400",
            disabled && "cursor-not-allowed"
          )}
          style={{
            height: '1.5rem'
          }}
        />
      </div>
    </FormFieldWrapper>
  )
})

TagInput.displayName = "TagInput"

export { TagInput }
