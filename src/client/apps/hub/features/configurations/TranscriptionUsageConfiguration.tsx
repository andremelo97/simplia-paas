import React, { useState, useEffect } from 'react'
import { Clock, TrendingUp, Settings, AlertCircle, CreditCard, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Card, Label, Progress, Alert, AlertTitle, AlertDescription, Checkbox, Select } from '@client/common/ui'
import { transcriptionUsageService } from '../../services/transcriptionUsageService'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

// Stripe Customer Portal URL
const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/eVqeVc21raBtc3p9Kdawo00'

interface CurrentUsage {
  month: string
  minutesUsed: number
  totalCost: number
  totalTranscriptions: number
  limit: number
  remaining: number
  overage: number
  overageAllowed: boolean
  percentUsed: number
}

interface UsageDataPoint {
  month: string
  minutesUsed: number
  totalCost: number
  totalTranscriptions: number
  limit: number
  overage: number
}

interface UsageDetailRecord {
  id: number
  transcriptionId: string
  audioDurationSeconds: number
  audioDurationMinutes: number
  sttModel: string
  costUsd: number
  usageDate: string
  createdAt: string
  updatedAt: string
}

interface UsageData {
  current: CurrentUsage
  history: UsageDataPoint[]
  plan: {
    slug: string
    name: string
    allowsCustomLimits: boolean
    allowsOverage: boolean
    languageDetectionEnabled: boolean
    isTrial: boolean
    trialDays: number | null
  }
  config?: {
    customMonthlyLimit: number | null
    transcriptionLanguage: string | null
    overageAllowed: boolean
    planActivatedAt: string | null
    expiresAt: string | null
    isTrialExpired: boolean
    remainingTrialDays: number | null
  }
}

const RECORDS_PER_PAGE = 10

export const TranscriptionUsageConfiguration: React.FC = () => {
  const { t } = useTranslation('hub')
  const { formatShortDate, formatMonthYear } = useDateFormatter()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customLimit, setCustomLimit] = useState<number>(2400)
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<string>('pt-BR')
  const [overageAllowed, setOverageAllowed] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Original values for comparison
  const [originalLimit, setOriginalLimit] = useState<number>(2400)
  const [originalLanguage, setOriginalLanguage] = useState<string>('pt-BR')
  const [originalOverage, setOriginalOverage] = useState<boolean>(false)

  // Detailed usage records (granular) with pagination
  const [detailRecords, setDetailRecords] = useState<UsageDetailRecord[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  // Calculate plan minimum limit dynamically based on current plan
  const planMinLimit = usage?.current?.limit || 2400

  useEffect(() => {
    loadUsage()
    loadDetails(1) // Load first page of details
  }, [])

  useEffect(() => {
    if (usage) {
      loadDetails(currentPage)
    }
  }, [currentPage])

  const loadUsage = async () => {
    try {
      setLoading(true)
      const usageData = await transcriptionUsageService.getUsage()

      if (!usageData?.current || !usageData?.plan) {
        throw new Error('Missing required fields in usage data')
      }

      // Ensure history is always an array
      if (!usageData.history) {
        usageData.history = []
      }

      setUsage(usageData)

      // Initialize custom limit from config
      const initLimit = usageData.config?.customMonthlyLimit || usageData.current.limit
      setCustomLimit(initLimit)
      setOriginalLimit(initLimit)

      // Initialize transcription language from config
      const initLanguage = usageData.config?.transcriptionLanguage || 'pt-BR'
      setTranscriptionLanguage(initLanguage)
      setOriginalLanguage(initLanguage)

      // Initialize overage allowed from config
      const initOverage = usageData.config?.overageAllowed || false
      setOverageAllowed(initOverage)
      setOriginalOverage(initOverage)
    } catch (error) {
      // Error loading transcription usage
    } finally {
      setLoading(false)
    }
  }

  const loadDetails = async (page: number) => {
    try {
      setDetailsLoading(true)
      const offset = (page - 1) * RECORDS_PER_PAGE
      const response = await transcriptionUsageService.getUsageDetails(RECORDS_PER_PAGE, offset)

      setDetailRecords(response.data || [])
      setTotalRecords(response.meta?.total || 0)
    } catch (error) {
      setDetailRecords([])
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!usage) return

    // Validate custom limit if it changed
    const limitChanged = customLimit !== originalLimit
    const languageChanged = transcriptionLanguage !== originalLanguage
    const overageChanged = overageAllowed !== originalOverage

    if (limitChanged && customLimit < planMinLimit) {
      setValidationError(t('transcription_usage.validation_min_limit', { limit: planMinLimit }))
      return
    }

    // Build update payload with only changed fields
    const updates: { customMonthlyLimit?: number; transcriptionLanguage?: string; overageAllowed?: boolean } = {}

    if (limitChanged && usage.plan.allowsCustomLimits) {
      updates.customMonthlyLimit = customLimit
    }

    if (languageChanged) {
      updates.transcriptionLanguage = transcriptionLanguage
    }

    if (overageChanged && usage.plan.allowsOverage) {
      updates.overageAllowed = overageAllowed
    }

    // Nothing to save
    if (Object.keys(updates).length === 0) {
      return
    }

    try {
      setSaving(true)
      setValidationError(null)
      await transcriptionUsageService.updateConfig(updates)
      await loadUsage() // Reload to get updated data
    } catch (error) {
      // Error updating configuration
    } finally {
      setSaving(false)
    }
  }

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatCost = (costUsd: number): string => {
    return `$${costUsd.toFixed(4)}`
  }

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
          {t('transcription_usage.loading')}
        </div>
      </div>
    )
  }

  if (!usage) {
    return (
      <div className="p-8">
        <Alert variant="error">{t('transcription_usage.error_loading')}</Alert>
      </div>
    )
  }

  const canCustomizeLimits = usage.plan.allowsCustomLimits
  const canEnableOverage = usage.plan.allowsOverage
  const hasAnyPremiumFeature = canCustomizeLimits || canEnableOverage
  const isFullVIP = canCustomizeLimits && canEnableOverage
  const hasOverage = usage.current.overage > 0

  // Check if anything changed
  const limitChanged = customLimit !== originalLimit
  const languageChanged = transcriptionLanguage !== originalLanguage
  const overageChanged = overageAllowed !== originalOverage
  const hasChanges = limitChanged || languageChanged || overageChanged

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Clock className="h-6 w-6 text-[#B725B7]" />
          <h1 className="text-2xl font-bold text-gray-900">{t('transcription_usage.title')}</h1>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#B725B7] text-white">
            TQ
          </span>
        </div>
        <p className="text-gray-600">
          {t('transcription_usage.subtitle')}
        </p>
      </div>

      {/* Plan Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">{t('transcription_usage.current_plan')}</span>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isFullVIP
            ? 'bg-pink-100 text-pink-700'
            : usage.plan.isTrial
            ? 'bg-orange-100 text-orange-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {usage.plan.name}
        </span>
        {/* Trial Expiration Badge */}
        {usage.plan.isTrial && usage.config?.expiresAt && (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            usage.config.isTrialExpired
              ? 'bg-red-100 text-red-700'
              : (usage.config.remainingTrialDays ?? 0) <= 2
              ? 'bg-orange-100 text-orange-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {usage.config.isTrialExpired
              ? t('transcription_usage.trial_expired')
              : `${t('transcription_usage.expires_in')} ${usage.config.remainingTrialDays} ${t('transcription_usage.days')}`
            }
          </span>
        )}
      </div>

      {/* Manage Subscription Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('transcription_usage.manage_subscription')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('transcription_usage.manage_subscription_description')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open(STRIPE_PORTAL_URL, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t('transcription_usage.open_billing_portal')}
          </Button>
        </div>
      </Card>

      {/* Current Month Usage */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[#B725B7]" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t('transcription_usage.current_month')} ({formatMonthYear(new Date(usage.current.month + '-01'))})
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {formatMinutes(usage.current.minutesUsed)} {t('transcription_usage.of')} {formatMinutes(usage.current.limit)} {t('transcription_usage.used')}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {usage.current.percentUsed.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={usage.current.percentUsed}
            className="h-3"
          />
          {usage.current.remaining > 0 ? (
            <p className="text-sm text-gray-600 mt-2">
              {formatMinutes(usage.current.remaining)} {t('transcription_usage.remaining').toLowerCase()}
            </p>
          ) : hasOverage && usage.current.overageAllowed ? (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ {formatMinutes(usage.current.overage)} {t('transcription_usage.overage').toLowerCase()}
            </p>
          ) : null}
        </div>

        {/* Quota Alerts */}
        {usage.current.remaining <= 0 && !usage.current.overageAllowed && (
          <Alert variant="gradient" className="mb-4">
            <AlertCircle className="h-5 w-5 text-[#E91E63] mt-0.5" />
            <div>
              <AlertTitle>{t('transcription_usage.quota_exceeded_title')}</AlertTitle>
              <AlertDescription>
                {t('transcription_usage.quota_exceeded_message', { limit: usage.current.limit })}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {usage.current.remaining > 0 && usage.current.percentUsed >= 80 && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-5 w-5 text-[#EAB308] mt-0.5" />
            <div>
              <AlertTitle>{t('transcription_usage.quota_warning_title')}</AlertTitle>
              <AlertDescription>
                {t('transcription_usage.quota_warning_message', {
                  used: usage.current.minutesUsed,
                  limit: usage.current.limit,
                  percent: usage.current.percentUsed.toFixed(1)
                })}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Metrics Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${canEnableOverage ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">{t('transcription_usage.used')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {usage.current.minutesUsed.toLocaleString()} min
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">{t('transcription_usage.limit')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {usage.current.limit.toLocaleString()} min
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">{t('transcription_usage.remaining')}</div>
            <div className={`text-2xl font-bold ${
              usage.current.remaining > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {usage.current.remaining > 0 ? usage.current.remaining.toLocaleString() : '0'}
            </div>
          </div>
          {/* Only show cost if plan allows overage */}
          {canEnableOverage && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{t('transcription_usage.total_cost')}</div>
              <div className="text-2xl font-bold text-[#B725B7]">
                {formatCost(usage.current.totalCost)}
              </div>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">{t('transcription_usage.transcriptions')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {usage.current.totalTranscriptions.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Premium Features Configuration */}
      {hasAnyPremiumFeature && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-[#B725B7]" />
            <h2 className="text-lg font-semibold text-gray-900">{t('transcription_usage.custom_quota_settings')}</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t('transcription_usage.premium_description')}
          </p>

          {/* Custom Limit */}
          {canCustomizeLimits && (
            <div className={canEnableOverage ? 'mb-6' : ''}>
              <Label htmlFor="customLimit">{t('transcription_usage.monthly_limit')}</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="customLimit"
                  type="number"
                  min={planMinLimit}
                  value={customLimit}
                  onChange={(e) => {
                    setCustomLimit(parseInt(e.target.value))
                    setValidationError(null)
                  }}
                  error={validationError || undefined}
                  className="flex-1"
                />
              </div>
              {!validationError && (
                <p className="text-xs text-gray-500 mt-2">
                  {t('transcription_usage.minimum_limit', { limit: planMinLimit.toLocaleString() })}
                </p>
              )}
            </div>
          )}

          {/* Overage Control */}
          {canEnableOverage && (
            <div className={canCustomizeLimits ? 'border-t pt-6' : ''}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="overageAllowed"
                  checked={overageAllowed}
                  onChange={(e) => setOverageAllowed(e.target.checked)}
                  disabled={saving}
                />
                <div className="flex-1">
                  <Label htmlFor="overageAllowed" className="font-medium text-gray-900">
                    {t('transcription_usage.allow_overage')}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('transcription_usage.overage_description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Single Save Button */}
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? t('transcription_usage.saving') : t('transcription_usage.save_changes')}
            </Button>
          </div>
        </Card>
      )}

      {/* Language Settings (Only show if NOT using auto-detect) */}
      {!usage.plan.languageDetectionEnabled && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-[#B725B7]" />
            <h2 className="text-lg font-semibold text-gray-900">{t('transcription_usage.language_settings')}</h2>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            {t('transcription_usage.language_settings_description')}
          </p>

          {/* Transcription Language */}
          <div className="mb-6">
            <Label htmlFor="transcriptionLanguage">{t('transcription_usage.transcription_language')}</Label>
            <Select
              id="transcriptionLanguage"
              value={transcriptionLanguage}
              onChange={(e) => setTranscriptionLanguage(e.target.value)}
              className="mt-2"
              options={[
                { value: 'pt-BR', label: 'Português (Brasil)' },
                { value: 'en-US', label: 'English (US)' }
              ]}
            />
            <p className="text-xs text-gray-500 mt-2">
              {t('transcription_usage.language_description')}
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? t('transcription_usage.saving') : t('transcription_usage.save_changes')}
            </Button>
          </div>
        </Card>
      )}

      {/* Usage History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('transcription_usage.usage_history')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.month')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.minutes_used')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.limit')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.overage')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.usage_percent')}</th>
              </tr>
            </thead>
            <tbody>
              {(usage.history || []).map((record) => {
                const usagePercent = (record.minutesUsed / record.limit) * 100
                return (
                  <tr key={record.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{formatMonthYear(new Date(record.month + '-01'))}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">
                      {record.minutesUsed.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {record.limit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {record.overage > 0 ? (
                        <span className="text-red-600">{record.overage.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={
                        usagePercent > 100 ? 'text-red-600 font-semibold' :
                        usagePercent > 80 ? 'text-orange-600' :
                        'text-gray-900'
                      }>
                        {usagePercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detailed Usage (Granular) */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('transcription_usage.detailed_usage')}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('transcription_usage.detailed_usage_subtitle')}</p>

        {detailsLoading ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
            {t('transcription_usage.loading_details')}
          </div>
        ) : detailRecords.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
            {t('transcription_usage.no_details_yet')}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.date')}</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.duration')}</th>
                    {/* Only show cost column if plan allows overage */}
                    {canEnableOverage && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.cost')}</th>
                    )}
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('transcription_usage.model')}</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{formatShortDate(record.usageDate)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 font-mono">
                        {formatDuration(record.audioDurationSeconds)}
                      </td>
                      {/* Only show cost if plan allows overage */}
                      {canEnableOverage && (
                        <td className="py-3 px-4 text-sm text-right text-[#B725B7] font-semibold">
                          {formatCost(record.costUsd)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                          {record.sttModel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {t('transcription_usage.showing_page', { current: currentPage, total: totalPages })}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || detailsLoading}
                  >
                    {t('transcription_usage.previous')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || detailsLoading}
                  >
                    {t('transcription_usage.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
