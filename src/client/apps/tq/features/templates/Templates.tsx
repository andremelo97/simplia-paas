import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Paginator
} from '@client/common/ui'
import { useTemplatesList } from '../../hooks/useTemplates'
import { TemplateRow } from '../../components/templates/TemplateRow'
import { TemplatesEmpty } from '../../components/templates/TemplatesEmpty'
import { TemplateFilters } from '../../components/templates/TemplateFilters'
import { Template } from '../../services/templates'

export const Templates: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const navigate = useNavigate()

  const {
    data: templates,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    setSearch,
    setActive,
    refetch
  } = useTemplatesList({
    search: searchQuery,
    active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    pageSize: 10
  })

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    setSearch(search)
  }

  const handleStatusFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status)
    setActive(status === 'all' ? undefined : status === 'active')
  }

  const handleEditTemplate = (template: Template) => {
    navigate(`/templates/${template.id}/edit`)
  }

  const handleDeleteTemplate = () => {
    refetch()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600 mt-1">
            Manage clinical documentation templates and standardize your notes
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/templates/create')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </Button>
      </div>

      {/* Filters */}
      <TemplateFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {/* Content */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            Template List ({templates?.length || 0} of {total} templates)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Error State */}
          {error && (
            <Alert className="mb-4">
              <AlertDescription>
                {error}{' '}
                <button
                  onClick={refetch}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  Try again
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <TemplatesEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          ) : (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-2 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">Created</div>
                <div className="flex-1">Title</div>
                <div className="flex-1">Description</div>
                <div className="w-20">Usage</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Template Rows */}
              <div className="divide-y divide-gray-100">
                {templates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Paginator
                currentPage={currentPage}
                totalItems={total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

    </div>
  )
}