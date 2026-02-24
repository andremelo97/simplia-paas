import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '../utils/cn'

const alertVariants = cva(
  "relative w-full rounded-xl border",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-950 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-0.1875rem] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-950",
        destructive:
          "border-red-500/50 text-red-700 bg-red-50/50 dark:border-red-500 [&>svg]:text-red-600 dark:text-red-50 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-0.1875rem] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
        error:
          "border-red-500/50 text-red-700 bg-red-50/50 [&>svg]:text-red-600 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-0.1875rem] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
        warning:
          "border-transparent overflow-hidden bg-white p-6",
        gradient:
          "border-transparent overflow-hidden bg-white p-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {variant === "gradient" && (
      <div className="absolute inset-0 bg-gradient-to-br from-[#B725B7] via-[#E91E63] to-[#B725B7] opacity-10" />
    )}
    {variant === "warning" && (
      <div className="absolute inset-0 bg-gradient-to-br from-[#EAB308] via-[#FDE047] to-[#EAB308] opacity-10" />
    )}
    <div className={variant === "gradient" || variant === "warning" ? "relative flex items-start gap-3" : undefined}>
      {children}
    </div>
  </div>
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight text-gray-900", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-gray-700 [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }