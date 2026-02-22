import * as React from "react"
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

    if (disabled) {
      return <>{children}</>
    }

    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    }

    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
    }

    return (
      <div
        className={cn("relative inline-block", className)}
        ref={ref}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
        {isVisible && (
          <div
            className={cn(
              "absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg pointer-events-none whitespace-nowrap text-center",
              positionClasses[side]
            )}
            role="tooltip"
          >
            {content}
            <div
              className={cn(
                "absolute w-0 h-0 border-4",
                arrowClasses[side]
              )}
            />
          </div>
        )}
      </div>
    )
  }
)
Tooltip.displayName = "Tooltip"

export { Tooltip }