import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './Dialog'
import { Button } from './Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'delete' | 'softDelete' | 'danger'
  isLoading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  const handleConfirm = async () => {
    await onConfirm()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      handleConfirm()
    }
  }

  // Icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'delete':
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        )
      case 'softDelete':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div className="px-6 py-4" onKeyDown={handleKeyDown}>
          <div className="sm:flex sm:items-start">
            {/* Icon */}
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              {getIcon()}

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mt-4 text-center">
                {title}
              </h3>

              {/* Description */}
              <div className="mt-2">
                <p className="text-sm text-gray-500 text-center">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="sm:w-auto w-full"
            >
              {cancelText}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              isLoading={isLoading}
              disabled={isLoading}
              className="sm:w-auto w-full"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
