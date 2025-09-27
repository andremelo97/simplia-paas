import React from 'react'
import { Receipt } from 'lucide-react'

interface QuotesEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const QuotesEmpty: React.FC<QuotesEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Receipt className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasQuery ? 'No quotes found' : 'No quotes yet'}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {hasQuery
          ? `No quotes match "${query}". Try adjusting your search.`
          : 'Create your first quote from a session to see it appear here.'
        }
      </p>
    </div>
  )
}