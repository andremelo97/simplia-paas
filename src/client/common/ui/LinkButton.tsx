import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'
import { buttonVariants, type ButtonProps } from './Button'

interface LinkButtonProps extends Omit<ButtonProps, 'onClick' | 'type'> {
  to: string
  children: React.ReactNode
}

export const LinkButton: React.FC<LinkButtonProps> = ({ 
  to, 
  variant = 'default', 
  size = 'default', 
  className, 
  children, 
  disabled,
  ...props 
}) => {
  // Custom styles for all variants (matching Button component)
  const customStyles = {
    fontFamily: 'Montserrat, sans-serif',
    height: '32px',
    minHeight: '32px',
    ...(variant === 'default' && {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: 'none',
      borderRadius: '5px'
    })
  }

  if (disabled) {
    return (
      <span 
        className={cn(buttonVariants({ variant, size }), 'pointer-events-none opacity-50', className)}
        style={customStyles}
        {...props}
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      to={to}
      className={cn(buttonVariants({ variant, size }), className)}
      style={customStyles}
      {...props}
    >
      {children}
    </Link>
  )
}