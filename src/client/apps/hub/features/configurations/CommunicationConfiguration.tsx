import React, { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Card, Checkbox, FormFieldWrapper, Alert, AlertDescription } from '@client/common/ui'
import { communicationService, CommunicationSettings } from '../../services/communicationService'

export const CommunicationConfiguration: React.FC = () => {
  const { t } = useTranslation('hub')
  const [settings, setSettings] = useState<CommunicationSettings>({
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: true,
    smtpUsername: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await communicationService.getSettings()
        if (data) {
          setSettings({
            smtpHost: data.smtpHost || '',
            smtpPort: data.smtpPort || 587,
            smtpSecure: data.smtpSecure ?? true,
            smtpUsername: data.smtpUsername || '',
            smtpPassword: data.smtpPassword || '',
            smtpFromEmail: data.smtpFromEmail || '',
            smtpFromName: data.smtpFromName || ''
          })
        }
      } catch (error) {
        console.error('Failed to load communication settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    try {
      await communicationService.updateSettings(settings)
    } catch (error) {
      console.error('Failed to update communication settings:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>{t('communication.loading')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-6 w-6 text-[#B725B7]" />
          <h1 className="text-2xl font-bold text-gray-900">{t('communication.title')}</h1>
        </div>
        <p className="text-gray-600">{t('communication.subtitle')}</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('communication.server_config')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldWrapper
            id="smtpHost"
            label={t('communication.host')}
            required
            helperText={t('communication.host_hint')}
          >
            <Input
              id="smtpHost"
              value={settings.smtpHost}
              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </FormFieldWrapper>

          <FormFieldWrapper
            id="smtpPort"
            label={t('communication.port')}
            required
            helperText={t('communication.port_hint')}
          >
            <Input
              id="smtpPort"
              type="number"
              value={settings.smtpPort}
              onChange={(e) =>
                setSettings({ ...settings, smtpPort: parseInt(e.target.value, 10) || 587 })
              }
              placeholder="587"
            />
          </FormFieldWrapper>
        </div>

        <div className="mt-4">
          <Checkbox
            label={t('communication.use_secure')}
            description={t('communication.secure_hint')}
            checked={settings.smtpSecure}
            onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('communication.authentication')}</h2>
        <div className="space-y-4">
          <FormFieldWrapper
            id="smtpUsername"
            label={t('communication.username')}
            required
          >
            <Input
              id="smtpUsername"
              value={settings.smtpUsername}
              onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
              placeholder="user@example.com"
            />
          </FormFieldWrapper>

          <FormFieldWrapper
            id="smtpPassword"
            label={t('communication.password')}
            required
            helperText={t('communication.password_hint')}
          >
            <Input
              id="smtpPassword"
              type="password"
              value={settings.smtpPassword}
              onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
              placeholder="********"
            />
          </FormFieldWrapper>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('communication.sender_info')}</h2>
        <div className="space-y-4">
          <FormFieldWrapper
            id="smtpFromName"
            label={t('communication.from_name')}
            helperText={t('communication.from_name_hint')}
          >
            <Input
              id="smtpFromName"
              value={settings.smtpFromName}
              onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
              placeholder=""
            />
          </FormFieldWrapper>
          <FormFieldWrapper
            id="smtpFromEmail"
            label={t('communication.from_email')}
            required
            helperText={t('communication.from_email_hint')}
          >
            <Input
              id="smtpFromEmail"
              type="email"
              value={settings.smtpFromEmail}
              onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
              placeholder="noreply@example.com"
            />
          </FormFieldWrapper>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSave}>
          {t('communication.save_changes')}
        </Button>
      </div>
    </div>
  )
}
