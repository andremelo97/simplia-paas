import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, StatusBadge, type Status } from '@client/common/ui'
import { tenantsService } from '../../../../services/tenants'
import { publishFeedback } from '@client/common/feedback/store'

interface TenantDetails {
  id: number
  name: string
  subdomain: string
  schemaName: string
  status: string
  createdAt: string
  updatedAt: string
}

export const TenantOverviewTab: React.FC = () => {
  const [tenant, setTenant] = useState<TenantDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const { tenantId } = useParams<{ tenantId: string }>()
  const navigate = useNavigate()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined

  useEffect(() => {
    if (!numericTenantId) return

    const fetchTenant = async () => {
      try {
        setLoading(true)
        const response = await tenantsService.getTenant(numericTenantId)
        setTenant(response.data)
      } catch (error) {
        publishFeedback({
          kind: 'error',
          message: 'Failed to load tenant details. Please try again.'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [numericTenantId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEdit = () => {
    navigate(`/tenants/${numericTenantId}/edit`)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tenant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Tenant not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tenant Information</h2>
          <Button variant="default" onClick={handleEdit}>
            Edit Tenant
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-2">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Name</dt>
            <dd className="text-sm text-gray-900">{tenant.name}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Status</dt>
            <dd className="text-sm">
              <StatusBadge status={tenant.status as Status} />
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Subdomain</dt>
            <dd className="text-sm text-gray-900 font-mono">{tenant.subdomain}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Schema Name</dt>
            <dd className="text-sm text-gray-900 font-mono">{tenant.schemaName}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Created At</dt>
            <dd className="text-sm text-gray-900">{formatDate(tenant.createdAt)}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Updated At</dt>
            <dd className="text-sm text-gray-900">{formatDate(tenant.updatedAt)}</dd>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}