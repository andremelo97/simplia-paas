import * as React from 'react'
import { ChevronDown, X, Check, Loader2 } from 'lucide-react'
import { cn } from '../utils/cn'

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  value?: string
  options: ComboboxOption[]
  onChange: (value?: string) => void
  onSearch?: (query: string) => void
  loading?: boolean
  placeholder?: string
  searchPlaceholder?: string
  noOptionsText?: string
  label?: string
  error?: string
  helperText?: string
  disabled?: boolean
  className?: string
}

export const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      value,
      options,
      onChange,
      onSearch,
      loading = false,
      placeholder = 'Select...',
      searchPlaceholder = 'Search...',
      noOptionsText = 'No results found',
      label,
      error,
      helperText,
      disabled = false,
      className
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLUListElement>(null)

    // Find selected option label
    const selectedOption = options.find((opt) => opt.value === value)

    // Filter options based on search query (client-side filtering when no onSearch)
    const filteredOptions = React.useMemo(() => {
      if (onSearch || !searchQuery) return options
      const query = searchQuery.toLowerCase()
      return options.filter((opt) => opt.label.toLowerCase().includes(query))
    }, [options, searchQuery, onSearch])

    // Handle click outside to close dropdown
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchQuery('')
          setHighlightedIndex(-1)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Reset highlighted index when options change
    React.useEffect(() => {
      setHighlightedIndex(-1)
    }, [filteredOptions])

    // Handle search query changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value
      setSearchQuery(query)
      if (onSearch) {
        onSearch(query)
      }
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setSearchQuery('')
          setHighlightedIndex(-1)
          break
      }
    }

    // Scroll highlighted option into view
    React.useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ block: 'nearest' })
        }
      }
    }, [highlightedIndex])

    // Handle option selection
    const handleSelect = (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
      setSearchQuery('')
      setHighlightedIndex(-1)
    }

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(undefined)
      setSearchQuery('')
    }

    // Toggle dropdown
    const toggleDropdown = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 0)
        }
      }
    }

    return (
      <div className={cn('w-full space-y-1', className)} ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        )}
        <div ref={containerRef} className="relative">
          {/* Trigger Button */}
          <button
            type="button"
            onClick={toggleDropdown}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'flex h-8 w-full items-center justify-between rounded border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all hover:bg-white/90 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-300 focus:border-red-500',
              !error && 'focus:border-[var(--brand-primary)]',
              isOpen && !error && 'border-[var(--brand-primary)]'
            )}
          >
            <span className={cn('truncate', !selectedOption && 'text-gray-500')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div className="flex items-center gap-1">
              {value && !disabled && (
                <X
                  className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={handleClear}
                />
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-400 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-100">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none"
                />
              </div>

              {/* Options List */}
              <ul
                ref={listRef}
                className="max-h-60 overflow-auto py-1"
                role="listbox"
              >
                {loading ? (
                  <li className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </li>
                ) : filteredOptions.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-gray-500">{noOptionsText}</li>
                ) : (
                  filteredOptions.map((option, index) => (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={option.value === value}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        'flex cursor-pointer items-center justify-between px-3 py-2 text-sm',
                        highlightedIndex === index && 'bg-gray-100',
                        option.value === value && 'font-medium text-[var(--brand-primary)]'
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {option.value === value && (
                        <Check className="h-4 w-4 text-[var(--brand-primary)]" />
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    )
  }
)

Combobox.displayName = 'Combobox'
