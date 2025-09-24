import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../utils/cn'

interface DropdownMenuProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

// Context para compartilhar estado entre componentes
const DropdownContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  dropdownRef: React.RefObject<HTMLDivElement>
} | null>(null)

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fechar dropdown ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, dropdownRef }}>
      <div ref={dropdownRef} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  asChild = false,
  className
}) => {
  const context = React.useContext(DropdownContext)
  if (!context) {
    throw new Error('DropdownMenuTrigger must be used within a DropdownMenu')
  }

  const { isOpen, setIsOpen } = context

  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      className: cn((children as React.ReactElement).props.className, className),
      'aria-expanded': isOpen,
      'aria-haspopup': true
    })
  }

  return (
    <Button
      onClick={handleClick}
      className={cn('flex items-center gap-1', className)}
      aria-expanded={isOpen}
      aria-haspopup={true}
    >
      {children}
      {/* ChevronDown removido - será controlado manualmente no componente */}
    </Button>
  )
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = 'start',
  className
}) => {
  const context = React.useContext(DropdownContext)
  if (!context) {
    throw new Error('DropdownMenuContent must be used within a DropdownMenu')
  }

  const { isOpen } = context

  if (!isOpen) return null

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  }

  return (
    <div
      className={cn(
        'absolute z-50 mt-1 min-w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg',
        alignmentClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onClick,
  className
}) => {
  const context = React.useContext(DropdownContext)
  if (!context) {
    throw new Error('DropdownMenuItem must be used within a DropdownMenu')
  }

  const { setIsOpen } = context

  const handleClick = () => {
    onClick?.()
    setIsOpen(false)
  }

  return (
    <button
      className={cn(
        'flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100',
        className
      )}
      onClick={handleClick}
      role="menuitem"
    >
      {children}
    </button>
  )
}