import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Input, DateInput, Checkbox, Label, Button } from '@client/common/ui'
import { Trash2 } from 'lucide-react'

interface PublicQuoteLinksFiltersProps {
  quoteFilter: string
  onQuoteFilterChange: (value: string) => void
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

export const PublicQuoteLinksFilters: React.FC<PublicQuoteLinksFiltersProps> = ({
  quoteFilter,
  onQuoteFilterChange,
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
  return (
    <Card>
      <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Search and filters
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
        >
          <Trash2 size={14} className="text-red-600" />
          Clear Filters
        </Button>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Filter by Quote"
            type="text"
            placeholder="Quote number"
            value={quoteFilter}
            onChange={(e) => onQuoteFilterChange(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <Label>Status</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-active"
                  checked={showActiveOnly}
                  onChange={(e) => onShowActiveOnlyChange(e.target.checked)}
                />
                <label htmlFor="show-active" className="text-sm text-gray-700 cursor-pointer">
                  Active
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-inactive"
                  checked={showInactiveOnly}
                  onChange={(e) => onShowInactiveOnlyChange(e.target.checked)}
                />
                <label htmlFor="show-inactive" className="text-sm text-gray-700 cursor-pointer">
                  Inactive
                </label>
              </div>
            </div>
          </div>

          <DateInput
            label="Created From"
            value={createdFrom}
            onChange={(e) => onCreatedFromChange(e.target.value)}
          />

          <DateInput
            label="Created To"
            value={createdTo}
            onChange={(e) => onCreatedToChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
