import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { Input } from './Input'

export interface PaginatorProps {
  currentPage: number
  totalItems: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (perPage: number) => void
  className?: string
}

export const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  className = ''
}) => {
  const { t } = useTranslation()
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

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage()
    }
  }

  // Don't show paginator if there's only one page or no items
  if (totalItems === 0 || totalPages <= 1) {
    return null
  }

  const from = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const to = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 ${className}`}>
      <div className="text-sm text-gray-600">
        {t('common:paginator.showing', { from, to, total: totalItems })}
      </div>

      <div className="flex items-center gap-3">
        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1">
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:border-[#B725B7] focus:outline-none"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {t('common:paginator.per_page')}
            </span>
          </div>
        )}

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {t('common:paginator.page_of', { current: currentPage, total: totalPages })}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('common:paginator.previous')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            {t('common:paginator.next')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Go to page input */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 whitespace-nowrap">{t('common:paginator.go_label')}</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={handleInputKeyDown}
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
            {t('common:paginator.go_button')}
          </Button>
        </div>
      </div>
    </div>
  )
}
