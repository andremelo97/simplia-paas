import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Input, Select } from '@client/common/ui'
import { DocumentConfig, DocumentData } from '../documentConfig'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface DocumentMetadataCardProps {
  document: DocumentData | null
  config: DocumentConfig
  status?: string
  onStatusChange?: (status: string) => void
  disabled?: boolean
}

export const DocumentMetadataCard: React.FC<DocumentMetadataCardProps> = ({
  document,
  config,
  status,
  onStatusChange,
  disabled = false
}) => {
  const { t } = useTranslation('tq')
  const { formatDateTime } = useDateFormatter()

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return formatDateTime(dateString)
  }

  const createdAt = document?.created_at || document?.createdAt
  const updatedAt = document?.updated_at || document?.updatedAt

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t(`${config.i18nKey}.information`, t('quotes.quote_information'))}
        </h2>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t(`${config.i18nKey}.number`, t('quotes.quote_number'))}
            value={document?.number || ''}
            disabled
            readOnly
          />

          {config.hasStatus && onStatusChange ? (
            <Select
              label={t('common.status')}
              value={status || 'draft'}
              onChange={(e) => onStatusChange(e.target.value)}
              options={config.statusOptions?.() || []}
              disabled={disabled}
            />
          ) : (
            <Input
              label={t('common.created_at')}
              value={formatDate(createdAt)}
              disabled
              readOnly
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {config.hasStatus ? (
            <>
              <Input
                label={t('common.created_at')}
                value={formatDate(createdAt)}
                disabled
                readOnly
              />

              <Input
                label={t('common.updated_at')}
                value={formatDate(updatedAt)}
                disabled
                readOnly
              />
            </>
          ) : (
            <>
              <Input
                label={t('common.updated_at')}
                value={formatDate(updatedAt)}
                disabled
                readOnly
              />

              <Input
                label={t('common.created_by')}
                value={document?.createdBy
                  ? `${document.createdBy.firstName || ''} ${document.createdBy.lastName || ''}`.trim()
                  : '—'
                }
                disabled
                readOnly
              />
            </>
          )}
        </div>

        {config.hasStatus && (
          <Input
            label={t('common.created_by')}
            value={document?.createdBy
              ? `${document.createdBy.firstName || ''} ${document.createdBy.lastName || ''}`.trim()
              : '—'
            }
            disabled
            readOnly
          />
        )}
      </CardContent>
    </Card>
  )
}
