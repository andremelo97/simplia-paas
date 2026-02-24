import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

interface DraggableFloatProps {
  children: React.ReactNode
  className?: string
}

export const DraggableFloat: React.FC<DraggableFloatProps> = ({ children, className }) => {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleDragStart = () => {
    isDragging.current = true
  }

  const handleDragEnd = () => {
    setTimeout(() => {
      isDragging.current = false
    }, 150)
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClickCapture={handleClickCapture}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "absolute pointer-events-auto cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  )
}
