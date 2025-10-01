import React, { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../utils/cn'

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void
  showClearButton?: boolean
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, showClearButton = true, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== null && value !== ''

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          ref={ref}
          value={value}
          className={cn(
            'flex w-full rounded-md border border-gray-200 bg-white/70 pl-9 pr-9 text-sm shadow-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:border-[#B725B7] hover:bg-white/90',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all',
            className
          )}
          style={{
            height: '32px',
            minHeight: '32px',
            borderRadius: '4px',
            padding: '4px 32px 4px 32px'
          }}
          {...props}
        />
        {showClearButton && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
