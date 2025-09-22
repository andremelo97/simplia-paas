import React from 'react'
import { Card, CardHeader, CardContent, Table, Badge } from '@client/common/ui'

interface EntitlementUser {
  email: string
  role: 'operations' | 'manager' | 'admin'
  grantedAt: string
}

interface EntitlementLicense {
  applicationId: number
  slug: string
  name: string
  status: 'active' | 'suspended' | 'expired'
  activatedAt: string
  seatsUsed: number
  maxUsers: number | null
  users: EntitlementUser[]
}

interface EntitlementsSummary {
  apps: number
  seatsUsed: number
  seatsLimit: number | null
}

interface EntitlementsSummaryCardProps {
  licenses: EntitlementLicense[]
  summary: EntitlementsSummary
}

export function EntitlementsSummaryCard({ licenses, summary }: EntitlementsSummaryCardProps) {
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'active': return 'success'
      case 'trial': return 'info'
      case 'suspended': return 'warning'
      case 'expired': return 'error'
      default: return 'default'
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const getTotalUsers = (license: EntitlementLicense) => {
    const used = license.seatsUsed || 0
    const total = license.maxUsers || '∞'
    return `${used}/${total}`
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Applications Summary</h3>
            <p className="text-sm text-gray-600 mt-1">
              Overview of all applications available for your organization
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {licenses.length} {licenses.length === 1 ? 'application' : 'applications'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-0 pb-6">
        <Table>
          <thead>
            <tr>
              <th className="text-left">Application</th>
              <th className="text-center">Status</th>
              <th className="text-center">Licenses Used/Total</th>
              <th className="text-center">Activated</th>
              <th className="text-center">Expires</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <tr key={license.applicationId}>
                <td>
                  <div>
                    <div className="font-medium text-gray-900">
                      {license.name || 'Unknown Application'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {license.slug || 'unknown'}
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <Badge variant={getStatusColor(license.status)}>
                    {license.status}
                  </Badge>
                </td>
                <td className="text-center">
                  <span className="font-mono text-sm">
                    {getTotalUsers(license)}
                  </span>
                </td>
                <td className="text-center text-sm">
                  {formatDate(license.activatedAt)}
                </td>
                <td className="text-center text-sm">
                  —
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  )
}