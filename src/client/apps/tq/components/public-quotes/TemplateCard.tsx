import React, { useState } from 'react'
import { Card, CardContent, StatusBadge } from '@client/common/ui'
import { FileText } from 'lucide-react'
import { PublicQuoteTemplate } from '../../services/publicQuotes'

interface TemplateCardProps {
  template: PublicQuoteTemplate
  onClick?: () => void
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  const [isFlashing, setIsFlashing] = useState(false)

  const handleClick = () => {
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 300)
    onClick?.()
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 border-2 border-gray-300 ${
        isFlashing ? 'ring-2 ring-[#B725B7] ring-offset-2 scale-[1.02]' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-6">
        {/* Template Preview Placeholder */}
        <div className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>

        {/* Template Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            {template.isDefault && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded flex-shrink-0 ml-2">
                Default
              </span>
            )}
          </div>

          {template.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {template.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <StatusBadge status={template.active ? 'active' : 'inactive'} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
