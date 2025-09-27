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
    refetch
  } = useTemplatesList({
    search: searchQuery,
    active: true,
    pageSize: 10
  })

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    setSearch(search)
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
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Error loading templates: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            Template List ({templates?.length || 0} of {total} templates)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
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
              <div className="space-y-4">
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
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Paginator
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {templates.filter(t => t.active).length}
              </div>
              <div className="text-sm text-gray-600">Active Templates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {templates.reduce((sum, t) => sum + t.usageCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Usage</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}