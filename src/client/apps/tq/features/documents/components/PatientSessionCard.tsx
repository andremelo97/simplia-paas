import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Input } from '@client/common/ui'

export interface PatientData {
  id: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface SessionData {
  number?: string
  status?: string
}

export interface PatientErrors {
  firstName: string
  lastName: string
  email: string
}

interface PatientSessionCardProps {
  patient: PatientData
  session: SessionData
  onPatientChange: (field: keyof Omit<PatientData, 'id'>, value: string) => void
  patientErrors?: PatientErrors
  disabled?: boolean
  i18nKey: string
}

export const PatientSessionCard: React.FC<PatientSessionCardProps> = ({
  patient,
  session,
  onPatientChange,
  patientErrors = { firstName: '', lastName: '', email: '' },
  disabled = false,
  i18nKey
}) => {
  const { t } = useTranslation('tq')

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t(`${i18nKey}.patient_session_info`, t('quotes.patient_session_info'))}
        </h2>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200">
          {/* Patient Info - Left */}
          <div className="space-y-2 pr-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">{t('common.patient')}</h3>
            {patient.id ? (
              <div className="space-y-3">
                <Input
                  label={t('patients.first_name')}
                  value={patient.firstName}
                  onChange={(e) => onPatientChange('firstName', e.target.value)}
                  disabled={disabled}
                  required
                  error={patientErrors.firstName}
                />

                <Input
                  label={t('patients.last_name')}
                  value={patient.lastName}
                  onChange={(e) => onPatientChange('lastName', e.target.value)}
                  disabled={disabled}
                  required
                  error={patientErrors.lastName}
                />

                <Input
                  label={t('patients.email')}
                  type="email"
                  value={patient.email}
                  onChange={(e) => onPatientChange('email', e.target.value)}
                  disabled={disabled}
                  required
                  error={patientErrors.email}
                />

                <Input
                  label={t('patients.phone')}
                  value={patient.phone}
                  onChange={(e) => onPatientChange('phone', e.target.value)}
                  disabled={disabled}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {t(`${i18nKey}.no_patient_data`, t('quotes.no_patient_data'))}
              </p>
            )}
          </div>

          {/* Session Info - Right */}
          <div className="space-y-2 pl-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">
              {t('sessions.session')}
            </h3>
            {session.number ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    {t('sessions.number')}
                  </label>
                  <p className="text-sm text-gray-900">{session.number}</p>
                </div>

                {session.status && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      {t('common.status')}
                    </label>
                    <p className="text-sm text-gray-900 capitalize">{session.status}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {t(`${i18nKey}.no_session_data`, t('quotes.no_session_data'))}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
