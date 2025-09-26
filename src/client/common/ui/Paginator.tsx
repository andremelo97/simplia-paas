import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

export interface PaginatorProps {
  currentPage: number
  totalItems: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  className?: string
}

export const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  className = ''
}) => {
  const [inputPage, setInputPage] = useState('')

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Update input when current page changes
  useEffect(() => {
    setInputPage('')
  }, [currentPage])

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handleGoToPage = () => {
    const pageNumber = parseInt(inputPage)
    if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber)
      setInputPage('')
    }
  }

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage()
    }
  }

  // Don't show paginator if there's only one page or no items
  if (totalItems === 0 || totalPages <= 1) {
    return null
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 ${className}`}>
      <div className="text-sm text-gray-600">
        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
      </div>

      <div className="flex items-center gap-3">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Go to page input */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 whitespace-nowrap">Go:</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyPress={handleInputKeyPress}
            className="w-14 text-center text-sm h-8"
            placeholder={currentPage.toString()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToPage}
            disabled={!inputPage || parseInt(inputPage) < 1 || parseInt(inputPage) > totalPages}
            className="h-8 px-2"
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  )
}