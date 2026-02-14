import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, TemplateEditor } from '@client/common/ui'
import { DocumentConfig } from '../documentConfig'

interface DocumentContentCardProps {
  content: string
  onChange: (content: string) => void
  config: DocumentConfig
  disabled?: boolean
  error?: string
}

export const DocumentContentCard: React.FC<DocumentContentCardProps> = ({
  content,
  onChange,
  config,
  disabled = false,
  error = ''
}) => {
  const { t } = useTranslation('tq')

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t(`${config.i18nKey}.content_section`, t('quotes.quote_content'))}
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        </h2>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <TemplateEditor
          content={content}
          onChange={onChange}
          placeholder={t(`${config.i18nKey}.placeholders.content`, t('quotes.placeholders.content'))}
          readonly={disabled}
          minHeight="500px"
          required
          error={error}
          requiredMessage={t('common:field_required')}
        />
      </CardContent>
    </Card>
  )
}
