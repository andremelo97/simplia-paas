import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input, Select, Badge } from '@client/common/ui'
import { ApplicationsService, Application } from '../../services/applications'
import { publishFeedback } from '@client/common/feedback/store'

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deprecated', label: 'Deprecated' }
]

export const ApplicationsList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const navigate = useNavigate()
  const applicationsPerPage = 10

  const fetchApplications = async () => {
    try {
      console.log('📱 [ApplicationsList] Starting fetch applications...')
      setLoading(true)
      
      const applicationsData = await ApplicationsService.getApplications()
      
      // Ensure applicationsData is an array
      if (!Array.isArray(applicationsData)) {
        console.error('❌ [ApplicationsList] Invalid data format received:', applicationsData)
        throw new Error('Invalid applications data format')
      }
      
      // Client-side filtering (backend doesn't support filters yet)
      let filteredApps = applicationsData

      if (searchTerm) {
        filteredApps = filteredApps.filter(app => 
          app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (statusFilter !== 'all') {
        filteredApps = filteredApps.filter(app => app.status === statusFilter)
      }

      // Client-side pagination
      const startIndex = (currentPage - 1) * applicationsPerPage
      const endIndex = startIndex + applicationsPerPage
      const paginatedApps = filteredApps.slice(startIndex, endIndex)

      console.log('✅ [ApplicationsList] Applications fetched successfully:', {
        total: applicationsData.length,
        filtered: filteredApps.length,
        displayed: paginatedApps.length
      })
      
      setApplications(paginatedApps)
      setTotalPages(Math.ceil(filteredApps.length / applicationsPerPage))
    } catch (error) {
      console.error('❌ [ApplicationsList] Failed to fetch applications:', error)
      publishFeedback({
        kind: 'error',
        message: 'Failed to load applications. Please try again.'
      })
      setApplications([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [currentPage, searchTerm, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
  }


  const getStatusBadge = (status: string, active: boolean) => {
    if (!active) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
    }
    
    switch (status) {
      case 'active':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full" style={{color: 'var(--brand-tertiary)', backgroundColor: 'var(--brand-tertiary-bg)', fontFamily: 'Montserrat, sans-serif'}}>Active</span>
      case 'deprecated':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Deprecated</span>
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">
            Manage applications, pricing matrix, and tenant licenses
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Applications</h2>
            <div className="flex items-center space-x-4">
              {/* Status Filter */}
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  options={statusOptions}
                />
              </div>
              {/* Search Input */}
              <div className="w-64">
                <Input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No applications found matching your criteria.'
                        : 'No applications available.'
                      }
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="tertiary">
                          {application.slug}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {application.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(application.status, application.active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(application.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={`/applications/${application.id}/pricing`}
                            className="action-link"
                            aria-label={`Manage pricing for ${application.name}`}
                          >
                            Manage Pricing
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}