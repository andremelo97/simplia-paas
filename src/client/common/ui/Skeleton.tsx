import * as React from "react"
import { cn } from '../utils/cn'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-gray-100", className)}
      {...props}
    />
  )
}

export { Skeleton }