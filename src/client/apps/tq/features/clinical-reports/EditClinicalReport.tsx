import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  TemplateEditor,
  isEditorContentFilled
} from '@client/common/ui'
import { clinicalReportsService, ClinicalReport } from '../../services/clinicalReports'
import { patientsService } from '../../services/patients'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

export const EditClinicalReport: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatDateTime } = useDateFormatter()

  const [report, setReport] = useState<ClinicalReport | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Patient data state (editable)
  const [patientFirstName, setPatientFirstName] = useState('')
  const [patientLastName, setPatientLastName] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientId, setPatientId] = useState<string | null>(null)
  const [contentError, setContentError] = useState('')

  // Load clinical report data
  useEffect(() => {
    if (!id) return

    let isCancelled = false

    const loadReportData = async () => {
      try {
        setIsLoading(true)
        const reportData = await clinicalReportsService.getById(id)

        if (!isCancelled) {
          setReport(reportData)
          setContent(reportData.content || '')
          setContentError('')

          // Load patient data
          setPatientFirstName(reportData.patient_first_name || '')
          setPatientLastName(reportData.patient_last_name || '')
          setPatientEmail(reportData.patient_email || '')
          setPatientPhone(reportData.patient_phone || '')
          setPatientId(reportData.patient_id || null)

          setLoadError(null)
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load clinical report')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadReportData()

    return () => {
      isCancelled = true
    }
  }, [id])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    if (contentError && isEditorContentFilled(newContent)) {
      setContentError('')
    }
  }

  const handleSave = async () => {
    if (!id || !report) return

    if (!isEditorContentFilled(content)) {
      setContentError(t('common:field_required'))
      return
    }

    setContentError('')
    setIsSaving(true)

    try {
      // 1. Update patient data if changed
      if (patientId) {
        const patientChanged =
          patientFirstName !== (report.patient_first_name || '') ||
          patientLastName !== (report.patient_last_name || '') ||
          patientEmail !== (report.patient_email || '') ||
          patientPhone !== (report.patient_phone || '')

        if (patientChanged) {
          await patientsService.updatePatient(patientId, {
            first_name: patientFirstName,
            last_name: patientLastName,
            email: patientEmail || undefined,
            phone: patientPhone || undefined
          })
        }
      }

      // 2. Update clinical report content if changed
      const reportChanged = content !== (report.content || '')

      if (reportChanged) {
        await clinicalReportsService.update(id, {
          content
        })
      }

      // 3. Fetch fresh report data to ensure all data is updated
      const freshReport = await clinicalReportsService.getById(id)

      // Update local state with fresh data
      setReport(freshReport)
      setContent(freshReport.content || '')
      setContentError('')

      // Update patient state with fresh data
      setPatientFirstName(freshReport.patient_first_name || '')
      setPatientLastName(freshReport.patient_last_name || '')
      setPatientEmail(freshReport.patient_email || '')
      setPatientPhone(freshReport.patient_phone || '')

      // Success feedback is handled automatically by HTTP interceptor
    } catch (error) {
      console.error('Failed to update clinical report:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/clinical-reports')
  }

  const handleView = () => {
    navigate(`/clinical-reports/${id}/view`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return formatDateTime(dateString)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_reports.edit')}</h1>
          <p className="text-gray-600 mt-1">{t('clinical_reports.loading_report')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (loadError || !report) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_reports.edit')}</h1>
          <p className="text-red-600 mt-1">{loadError || t('clinical_reports.report_not_found')}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/clinical-reports')}>
          {t('clinical_reports.back_to_reports')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_reports.edit')}</h1>
          <p className="text-gray-600 mt-1">
            {t('clinical_reports.report')} {report.number} • {report.patient_first_name || report.patient_last_name ? `${report.patient_first_name || ''} ${report.patient_last_name || ''}`.trim() : ''}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleView}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          {t('clinical_reports.view')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - 60% - Report Details */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {/* Report Metadata */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('clinical_reports.information')}</h2>
              </CardHeader>

              <CardContent className="space-y-4 px-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('clinical_reports.number')}
                    value={report.number}
                    disabled
                    readOnly
                  />

                  <Input
                    label={t('common.created_at')}
                    value={formatDate(report.created_at)}
                    disabled
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('common.updated_at')}
                    value={formatDate(report.updated_at)}
                    disabled
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            {/* Report Content */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('clinical_reports.content_section')}
                  <span className="ml-1 text-red-500" aria-hidden="true">*</span>
                </h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <TemplateEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder={t('clinical_reports.placeholders.content')}
                  readonly={isSaving}
                  minHeight="500px"
                  required
                  error={contentError}
                  requiredMessage={t('common:field_required')}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
              <Button
                variant="default"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? t('common.saving') : t('common.save_changes')}
              </Button>

              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
                style={{ height: '32px', minHeight: '32px' }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - 40% - Patient & Session */}
        <div className="lg:col-span-2">
          <div className="space-y-6 sticky top-6">
            {/* Patient and Session Information */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('clinical_reports.patient_session_info')}</h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200">
                  {/* Patient Info - Left */}
                  <div className="space-y-2 pr-4">
                    <h3 className="text-xs font-semibold text-gray-900 mb-2">{t('common.patient')}</h3>
                    {patientId ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.first_name')}
                          </label>
                          <input
                            type="text"
                            value={patientFirstName}
                            onChange={(e) => setPatientFirstName(e.target.value)}
                            disabled={isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.last_name')}
                          </label>
                          <input
                            type="text"
                            value={patientLastName}
                            onChange={(e) => setPatientLastName(e.target.value)}
                            disabled={isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.email')}
                          </label>
                          <input
                            type="email"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            disabled={isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.phone')}
                          </label>
                          <input
                            type="text"
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            disabled={isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('clinical_reports.no_patient_data')}</p>
                    )}
                  </div>

                  {/* Session Info - Right */}
                  <div className="space-y-2 pl-4">
                    <h3 className="text-xs font-semibold text-gray-900 mb-2">{t('clinical_reports.session')}</h3>
                    {report.session_number ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('sessions.number')}
                          </label>
                          <p className="text-sm text-gray-900">{report.session_number}</p>
                        </div>

                        {report.session_status && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              {t('common.status')}
                            </label>
                            <p className="text-sm text-gray-900 capitalize">{report.session_status}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">{t('clinical_reports.no_session_data')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
