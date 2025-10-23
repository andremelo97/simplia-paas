import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { Button, Card, Input, Textarea, Alert, AlertDescription } from '@client/common/ui';
import { emailTemplateService, EmailTemplate } from '../../services/emailTemplateService';

export const EmailTemplateConfiguration: React.FC = () => {
  const { t } = useTranslation('tq');
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState('');
  const [bodyError, setBodyError] = useState('');

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emailTemplateService.getTemplate();

      // Defensive null checking for 404 or malformed responses
      if (data && data.subject && data.body) {
        setTemplate(data);
        setSubject(data.subject);
        setBody(data.body);
        setSubjectError('');
        setBodyError('');
      } else {
        setError(t('configurations.email_template.failed_to_load'));
      }
    } catch (err) {
      console.error('Failed to load email template:', err);
      setError(t('configurations.email_template.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    // Validate subject
    if (!trimmedSubject) {
      setSubjectError(t('common:field_required'));
      return;
    }

    // Validate body
    if (!trimmedBody) {
      setBodyError(t('common:field_required'));
      return;
    }

    // Validate $PUBLIC_LINK$ presence
    if (!trimmedBody.includes('$PUBLIC_LINK$')) {
      setBodyError(t('configurations.email_template.public_link_required'));
      return;
    }

    // Validate $PASSWORD_BLOCK$ presence
    if (!trimmedBody.includes('$PASSWORD_BLOCK$')) {
      setBodyError(t('configurations.email_template.password_block_required'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updatedTemplate = await emailTemplateService.updateTemplate({
        subject: trimmedSubject,
        body: trimmedBody
      });
      setTemplate(updatedTemplate);
      setSubject(updatedTemplate.subject);
      setBody(updatedTemplate.body);
      setSubjectError('');
      setBodyError('');
    } catch (err) {
      console.error('Failed to update email template:', err);
      setError(t('configurations.email_template.failed_to_save'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(t('configurations.email_template.reset_confirm'))) return;

    try {
      setSaving(true);
      setError(null);
      const resetTemplate = await emailTemplateService.resetTemplate();
      setTemplate(resetTemplate);
      setSubject(resetTemplate.subject);
      setBody(resetTemplate.body);
      setSubjectError('');
      setBodyError('');
    } catch (err) {
      console.error('Failed to reset email template:', err);
      setError(t('configurations.email_template.failed_to_reset'));
    } finally {
      setSaving(false);
    }
  };

  // Don't render form until data is loaded
  if (loading) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>{t('common:loading')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-6 w-6 text-[#B725B7]" />
          <h1 className="text-2xl font-bold text-gray-900">
            {t('configurations.email_template.title')}
          </h1>
        </div>
        <p className="text-gray-600">
          {t('configurations.email_template.description')}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Template Form */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Subject field */}
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              {t('configurations.email_template.subject')}
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setSubjectError('');
              }}
              placeholder={t('configurations.email_template.subject_placeholder')}
              className={subjectError ? 'border-red-500' : ''}
            />
            {subjectError && (
              <p className="text-sm text-red-600">{subjectError}</p>
            )}
          </div>

          {/* Body field */}
          <div className="space-y-2">
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">
              {t('configurations.email_template.body')}
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            </label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setBodyError('');
              }}
              placeholder={t('configurations.email_template.body_placeholder')}
              rows={12}
              className={bodyError ? 'border-red-500' : ''}
            />
            {bodyError && (
              <p className="text-sm text-red-600">{bodyError}</p>
            )}
          </div>

          {/* Available variables help */}
          <div className="relative overflow-hidden bg-white border border-[#B725B7] rounded-md p-4">
            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#B725B7] via-[#E91E63] to-[#B725B7] opacity-10" />

            {/* Content */}
            <div className="relative">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {t('configurations.email_template.available_variables')}
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><code className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded">$quoteNumber$</code> - {t('configurations.email_template.var_quote_number')}</li>
                <li><code className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded">$patientName$</code> - {t('configurations.email_template.var_patient_name')}</li>
                <li><code className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded">$clinicName$</code> - {t('configurations.email_template.var_clinic_name')}</li>
                <li><code className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded">$PUBLIC_LINK$</code> - {t('configurations.email_template.var_public_link')} <span className="text-red-600 font-semibold">*</span></li>
                <li><code className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded">$PASSWORD_BLOCK$</code> - {t('configurations.email_template.var_password_block')} <span className="text-red-600 font-semibold">*</span></li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">
                <span className="text-red-600 font-semibold">*</span> {t('configurations.email_template.required_variable')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="primary"
            >
              {saving ? t('common:saving') : t('common:save_changes')}
            </Button>
            <Button
              onClick={handleReset}
              disabled={saving}
              variant="outline"
            >
              {t('configurations.email_template.reset_to_default')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
