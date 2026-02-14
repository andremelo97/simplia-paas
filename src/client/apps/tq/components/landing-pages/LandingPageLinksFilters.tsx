import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, CardTitle, Input, DateInput, Checkbox, Label, Button, Select } from '@client/common/ui'
import { Trash2 } from 'lucide-react'

interface LandingPageLinksFiltersProps {
  documentFilter: string
  onDocumentFilterChange: (value: string) => void
  documentTypeFilter: string
  onDocumentTypeFilterChange: (value: string) => void
  showActiveOnly: boolean
  onShowActiveOnlyChange: (value: boolean) => void
  showInactiveOnly: boolean
  onShowInactiveOnlyChange: (value: boolean) => void
  createdFrom: string
  onCreatedFromChange: (value: string) => void
  createdTo: string
  onCreatedToChange: (value: string) => void
  onClearFilters: () => void
}

export const LandingPageLinksFilters: React.FC<LandingPageLinksFiltersProps> = ({
  documentFilter,
  onDocumentFilterChange,
  documentTypeFilter,
  onDocumentTypeFilterChange,
  showActiveOnly,
  onShowActiveOnlyChange,
  showInactiveOnly,
  onShowInactiveOnlyChange,
  createdFrom,
  onCreatedFromChange,
  createdTo,
  onCreatedToChange,
  onClearFilters
}) => {
  const { t } = useTranslation('tq')

  return (
    <Card>
      <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {t('landing_pages.filters.title')}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
        >
          <Trash2 size={14} className="text-red-600" />
          {t('landing_pages.filters.clear_filters')}
        </Button>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            label={t('landing_pages.filters.filter_by_document')}
            type="text"
            placeholder={t('landing_pages.filters.document_number_placeholder')}
            value={documentFilter}
            onChange={(e) => onDocumentFilterChange(e.target.value)}
          />

          <Select
            label={t('landing_pages.filters.document_type')}
            value={documentTypeFilter}
            onChange={(e) => onDocumentTypeFilterChange(e.target.value)}
            options={[
              { value: 'all', label: t('common:all') },
              { value: 'quote', label: t('modals.template_quote.type_quote') },
              { value: 'prevention', label: t('modals.template_quote.type_prevention') }
            ]}
          />

          <div className="flex flex-col gap-3">
            <Label>{t('common.status')}</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-active"
                  checked={showActiveOnly}
                  onChange={(e) => onShowActiveOnlyChange(e.target.checked)}
                />
                <label htmlFor="show-active" className="text-sm text-gray-700 cursor-pointer">
                  {t('common.active')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-inactive"
                  checked={showInactiveOnly}
                  onChange={(e) => onShowInactiveOnlyChange(e.target.checked)}
                />
                <label htmlFor="show-inactive" className="text-sm text-gray-700 cursor-pointer">
                  {t('common.inactive')}
                </label>
              </div>
            </div>
          </div>

          <DateInput
            label={t('landing_pages.filters.created_from')}
            value={createdFrom}
            onChange={(e) => onCreatedFromChange(e.target.value)}
          />

          <DateInput
            label={t('landing_pages.filters.created_to')}
            value={createdTo}
            onChange={(e) => onCreatedToChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
