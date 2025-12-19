import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, StatusBadge, Status, ConfirmDialog } from '@client/common/ui'
import { Clock, Edit, Trash2 } from 'lucide-react'
import { transcriptionPlansService, TranscriptionPlan } from '../../services/transcriptionPlans'

export const TranscriptionPlansList: React.FC = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<TranscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  // ConfirmDialog state for deactivate
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<{id: number, name: string} | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await transcriptionPlansService.getPlans()
      setPlans(response.plans)
    } catch (err: any) {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleDeactivateClick = (plan: TranscriptionPlan) => {
    setDeactivateTarget({
      id: plan.id,
      name: plan.name
    })
    setShowDeactivateDialog(true)
  }

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return

    setIsDeactivating(true)
    try {
      await transcriptionPlansService.deletePlan(deactivateTarget.id)
      // Feedback is handled automatically by HTTP interceptor
      // Reload list
      await fetchPlans()
    } catch (error) {
      // Error feedback is also handled by HTTP interceptor
    } finally {
      setIsDeactivating(false)
      setShowDeactivateDialog(false)
      setDeactivateTarget(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transcription Plans</h1>
          <p className="text-gray-600 mt-1">
            Manage transcription quota plans (Basic, VIP, etc.)
          </p>
        </div>
        <Link to="/transcription-plans/create">
          <Button variant="default" style={{ width: '120px' }}>
            + Create
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Plans</h2>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custom Limits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Transcription Plans
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Create your first transcription plan to get started with quota management.
                      </p>
                      <Link to="/transcription-plans/create">
                        <Button variant="default">
                          + Create First Plan
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {plan.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan.slug}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {plan.monthlyMinutesLimit.toLocaleString()} min
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({Math.floor(plan.monthlyMinutesLimit / 60)}h)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {plan.sttModel || 'nova-3'}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({formatCurrency(plan.costPerMinuteUsd)}/min)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plan.allowsCustomLimits ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plan.allowsOverage ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={plan.active ? 'active' : 'inactive' as Status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={`/transcription-plans/${plan.id}/edit`}
                            className="action-link"
                            aria-label={`Edit ${plan.name}`}
                          >
                            Edit
                          </Link>
                          {plan.active && (
                            <button
                              onClick={() => handleDeactivateClick(plan)}
                              className="action-link text-red-600 hover:text-red-700"
                              aria-label={`Deactivate ${plan.name}`}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Transcription Plan"
        description={`Are you sure you want to deactivate "${deactivateTarget?.name}"? This plan will no longer be available for new assignments.`}
        confirmText="Deactivate"
        variant="softDelete"
        isLoading={isDeactivating}
      />
    </div>
  )
}
