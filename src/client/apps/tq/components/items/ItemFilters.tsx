import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Input } from '@client/common/ui'

interface ItemFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const ItemFilters: React.FC<ItemFiltersProps> = ({
  searchQuery,
  onSearchChange
}) => {
  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
        Search
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Input
              label="Find items quickly"
              type="text"
              placeholder="Search by item name or description"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}