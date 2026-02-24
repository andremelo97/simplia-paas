import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from '../utils/cn'

export interface TooltipProps {
  children: React.ReactNode
  content: string
  disabled?: boolean
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, disabled = false, side = 'top', className }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)
    const triggerRef = React.useRef<HTMLDivElement>(null)
    const tooltipRef = React.useRef<HTMLDivElement>(null)
    const [position, setPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 })

    React.useEffect(() => {
      if (!isVisible || !triggerRef.current) return

      const rect = triggerRef.current.getBoundingClientRect()
      const tooltip = tooltipRef.current
      const tw = tooltip?.offsetWidth || 0
      const th = tooltip?.offsetHeight || 0
      const gap = 8

      let top = 0
      let left = 0

      switch (side) {
        case 'top':
          top = rect.top - th - gap
          left = rect.left + rect.width / 2 - tw / 2
          break
        case 'bottom':
          top = rect.bottom + gap
          left = rect.left + rect.width / 2 - tw / 2
          break
        case 'left':
          top = rect.top + rect.height / 2 - th / 2
          left = rect.left - tw - gap
          break
        case 'right':
          top = rect.top + rect.height / 2 - th / 2
          left = rect.right + gap
          break
      }

      setPosition({ top, left })
    }, [isVisible, side])

    if (disabled) {
      return <>{children}</>
    }

    return (
      <div
        className={cn("relative inline-block", className)}
        ref={(node) => {
          (triggerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
        {isVisible && createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg pointer-events-none whitespace-nowrap text-center"
            style={{ top: position.top, left: position.left }}
            role="tooltip"
          >
            {content}
          </div>,
          document.body
        )}
      </div>
    )
  }
)
Tooltip.displayName = "Tooltip"

export { Tooltip }
