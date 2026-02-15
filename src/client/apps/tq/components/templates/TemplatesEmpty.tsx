import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileType, Plus } from 'lucide-react'
import { Button } from '@client/common/ui'

interface TemplatesEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const TemplatesEmpty: React.FC<TemplatesEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileType className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasQuery ? t('templates.empty.not_found') : t('templates.empty.no_templates')}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {hasQuery
          ? t('templates.empty.no_match', { query })
          : t('templates.empty.get_started')
        }
      </p>

      {!hasQuery && (
        <Button variant="secondary" onClick={() => navigate('/templates/create')} className="mt-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('templates.empty.create_first')}
        </Button>
      )}
    </div>
  )
}