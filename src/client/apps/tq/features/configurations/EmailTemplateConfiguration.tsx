import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { Button, Card, Input, Textarea, Alert, AlertDescription, Checkbox } from '@client/common/ui';
import {
  emailTemplateService,
  EmailTemplateSettings,
  Branding,
  ColorOption,
  TextColorOption,
  SocialLinks
} from '../../services/emailTemplateService';

const DEFAULT_SETTINGS: EmailTemplateSettings = {
  ctaButtonText: 'Ver Cotação',
  showLogo: true,
  showSocialLinks: false,
  showAddress: false,
  showPhone: false,
  address: '',
  phone: '',
  socialLinks: {
    facebook: '',
    instagram: '',
    linkedin: '',
    website: ''
  },
  headerColor: 'primary-gradient',
  headerTextColor: 'white',
  buttonColor: 'primary-gradient',
  buttonTextColor: 'white'
};

// Color options organized: solid colors first, then gradients
const COLOR_OPTIONS: ColorOption[] = [
  'white',
  'black',
  'primary',
  'secondary',
  'tertiary',
  'primary-gradient',
  'secondary-gradient',
  'tertiary-gradient'
];

// Helper function to get the CSS background for a color option
const getColorStyle = (color: ColorOption, branding: Branding | null): React.CSSProperties => {
  const primaryColor = branding?.primaryColor || '#B725B7';
  const secondaryColor = branding?.secondaryColor || '#E91E63';
  const tertiaryColor = branding?.tertiaryColor || '#5ED6CE';

  switch (color) {
    case 'white':
      return { backgroundColor: '#ffffff' };
    case 'black':
      return { backgroundColor: '#1f2937' };
    case 'primary':
      return { backgroundColor: primaryColor };
    case 'secondary':
      return { backgroundColor: secondaryColor };
    case 'tertiary':
      return { backgroundColor: tertiaryColor };
    case 'primary-gradient':
      return { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
    case 'secondary-gradient':
      return { background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})` };
    case 'tertiary-gradient':
      return { background: `linear-gradient(135deg, ${tertiaryColor}, ${primaryColor})` };
    default:
      return { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
  }
};

// Text color options
const TEXT_COLOR_OPTIONS: TextColorOption[] = ['white', 'black'];

export const EmailTemplateConfiguration: React.FC = () => {
  const { t } = useTranslation('tq');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [settings, setSettings] = useState<EmailTemplateSettings>(DEFAULT_SETTINGS);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [locale, setLocale] = useState('pt-BR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTemplate();
  }, []);

  // Debounced preview update
  const updatePreview = useCallback(async () => {
    if (!body || !subject) return;

    setPreviewLoading(true);
    try {
      const preview = await emailTemplateService.getPreview({
        subject,
        body,
        settings
      });
      setPreviewHtml(preview.html);
    } catch (err) {
      // Failed to generate preview
    } finally {
      setPreviewLoading(false);
    }
  }, [subject, body, settings]);

  // Debounce preview updates
  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = setTimeout(() => {
      updatePreview();
    }, 500);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [subject, body, settings, updatePreview]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emailTemplateService.getTemplate();

      if (data && data.subject && data.body) {
        setSubject(data.subject);
        setBody(data.body);
        setSettings(data.settings || DEFAULT_SETTINGS);
        setBranding(data.branding);
        setLocale(data.locale || 'pt-BR');
      } else {
        setError(t('configurations.email_template.failed_to_load'));
      }
    } catch (err) {
      setError(t('configurations.email_template.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedSubject || !trimmedBody) {
      setError(t('common:field_required'));
      return;
    }

    if (!trimmedBody.includes('$PUBLIC_LINK$')) {
      setError(t('configurations.email_template.public_link_required'));
      return;
    }

    if (!trimmedBody.includes('$PASSWORD_BLOCK$')) {
      setError(t('configurations.email_template.password_block_required'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await emailTemplateService.updateTemplate({
        subject: trimmedSubject,
        body: trimmedBody,
        settings
      });
    } catch (err) {
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
      setSubject(resetTemplate.subject);
      setBody(resetTemplate.body);
      setSettings(resetTemplate.settings || DEFAULT_SETTINGS);
    } catch (err) {
      setError(t('configurations.email_template.failed_to_reset'));
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof EmailTemplateSettings>(
    key: K,
    value: EmailTemplateSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSocialLink = (platform: keyof SocialLinks, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

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

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Subject */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('configurations.email_template.subject')}
            </h2>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('configurations.email_template.subject_placeholder')}
            />
          </Card>

          {/* Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('configurations.email_template.settings_title')}
            </h2>
            <div className="space-y-4">
              {/* CTA Button Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('configurations.email_template.cta_button_text')}
                </label>
                <Input
                  value={settings.ctaButtonText}
                  onChange={(e) => updateSetting('ctaButtonText', e.target.value)}
                  placeholder={locale === 'pt-BR' ? 'Ver Cotação' : 'View Quote'}
                />
              </div>

              {/* Contact Information Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('configurations.email_template.contact_info_title')}
                </h3>

                {/* Phone */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showPhone"
                      checked={settings.showPhone}
                      onChange={(e) => updateSetting('showPhone', e.target.checked)}
                    />
                    <label htmlFor="showPhone" className="text-sm text-gray-700 cursor-pointer">
                      {t('configurations.email_template.show_phone')}
                    </label>
                  </div>
                  {settings.showPhone && (
                    <Input
                      value={settings.phone}
                      onChange={(e) => updateSetting('phone', e.target.value)}
                      placeholder={t('configurations.email_template.phone_placeholder')}
                    />
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showAddress"
                      checked={settings.showAddress}
                      onChange={(e) => updateSetting('showAddress', e.target.checked)}
                    />
                    <label htmlFor="showAddress" className="text-sm text-gray-700 cursor-pointer">
                      {t('configurations.email_template.show_address')}
                    </label>
                  </div>
                  {settings.showAddress && (
                    <Textarea
                      value={settings.address}
                      onChange={(e) => updateSetting('address', e.target.value)}
                      placeholder={t('configurations.email_template.address_placeholder')}
                      rows={2}
                    />
                  )}
                </div>

                {/* Social Links */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showSocialLinks"
                      checked={settings.showSocialLinks}
                      onChange={(e) => updateSetting('showSocialLinks', e.target.checked)}
                    />
                    <label htmlFor="showSocialLinks" className="text-sm text-gray-700 cursor-pointer">
                      {t('configurations.email_template.show_social_links')}
                    </label>
                  </div>
                  {settings.showSocialLinks && (
                    <div className="space-y-2 ml-6">
                      <Input
                        value={settings.socialLinks?.facebook || ''}
                        onChange={(e) => updateSocialLink('facebook', e.target.value)}
                        placeholder={t('configurations.email_template.facebook_placeholder')}
                      />
                      <Input
                        value={settings.socialLinks?.instagram || ''}
                        onChange={(e) => updateSocialLink('instagram', e.target.value)}
                        placeholder={t('configurations.email_template.instagram_placeholder')}
                      />
                      <Input
                        value={settings.socialLinks?.linkedin || ''}
                        onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                        placeholder={t('configurations.email_template.linkedin_placeholder')}
                      />
                      <Input
                        value={settings.socialLinks?.website || ''}
                        onChange={(e) => updateSocialLink('website', e.target.value)}
                        placeholder={t('configurations.email_template.website_placeholder')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Show Logo Toggle */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showLogo"
                  checked={settings.showLogo}
                  onChange={(e) => updateSetting('showLogo', e.target.checked)}
                />
                <label htmlFor="showLogo" className="text-sm text-gray-700 cursor-pointer">
                  {t('configurations.email_template.show_logo')}
                </label>
                {!branding?.logoUrl && (
                  <span className="text-xs text-amber-600">
                    ({t('configurations.email_template.no_logo_configured')})
                  </span>
                )}
              </div>

              {/* Header Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('configurations.email_template.header_color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => {
                    const isSelected = settings.headerColor === color;
                    const colorKey = color.replace('-gradient', '_gradient');
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateSetting('headerColor', color)}
                        className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
                          isSelected ? 'ring-2 ring-offset-2 ring-[#B725B7]' : ''
                        } ${color === 'white' ? 'border-2 border-gray-300' : ''}`}
                        style={getColorStyle(color, branding)}
                        title={t(`configurations.email_template.color_${colorKey}`)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Header Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('configurations.email_template.header_text_color')}
                </label>
                <div className="flex gap-2">
                  {TEXT_COLOR_OPTIONS.map((color) => {
                    const isSelected = settings.headerTextColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateSetting('headerTextColor', color)}
                        className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
                          isSelected ? 'ring-2 ring-offset-2 ring-[#B725B7]' : ''
                        } ${color === 'white' ? 'border-2 border-gray-300' : ''}`}
                        style={{ backgroundColor: color === 'white' ? '#ffffff' : '#1f2937' }}
                        title={t(`configurations.email_template.text_color_${color}`)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Button Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('configurations.email_template.button_color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => {
                    const isSelected = settings.buttonColor === color;
                    const colorKey = color.replace('-gradient', '_gradient');
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateSetting('buttonColor', color)}
                        className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
                          isSelected ? 'ring-2 ring-offset-2 ring-[#B725B7]' : ''
                        } ${color === 'white' ? 'border-2 border-gray-300' : ''}`}
                        style={getColorStyle(color, branding)}
                        title={t(`configurations.email_template.color_${colorKey}`)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Button Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('configurations.email_template.button_text_color')}
                </label>
                <div className="flex gap-2">
                  {TEXT_COLOR_OPTIONS.map((color) => {
                    const isSelected = settings.buttonTextColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateSetting('buttonTextColor', color)}
                        className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
                          isSelected ? 'ring-2 ring-offset-2 ring-[#B725B7]' : ''
                        } ${color === 'white' ? 'border-2 border-gray-300' : ''}`}
                        style={{ backgroundColor: color === 'white' ? '#ffffff' : '#1f2937' }}
                        title={t(`configurations.email_template.text_color_${color}`)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Body Template */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('configurations.email_template.body')}
            </h2>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('configurations.email_template.body_placeholder')}
              rows={8}
              className="font-mono text-sm"
            />

            {/* Variables help */}
            <div className="relative overflow-hidden bg-white border border-[#B725B7] rounded-md p-4 mt-4">
              {/* Gradient background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#B725B7] via-[#E91E63] to-[#B725B7] opacity-10" />

              {/* Content */}
              <div className="relative">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {t('configurations.email_template.available_variables')}
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <code
                      className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => setBody(prev => prev + '$patientName$')}
                    >$patientName$</code> - {t('configurations.email_template.var_patient_name')}
                  </li>
                  <li>
                    <code
                      className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => setBody(prev => prev + '$quoteNumber$')}
                    >$quoteNumber$</code> - {t('configurations.email_template.var_quote_number')}
                  </li>
                  <li>
                    <code
                      className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => setBody(prev => prev + '$clinicName$')}
                    >$clinicName$</code> - {t('configurations.email_template.var_clinic_name')}
                  </li>
                  <li>
                    <code
                      className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => setBody(prev => prev + '$PUBLIC_LINK$')}
                    >$PUBLIC_LINK$</code> - {t('configurations.email_template.var_public_link')} <span className="text-red-600 font-semibold">*</span>
                  </li>
                  <li>
                    <code
                      className="bg-white/70 border border-[#B725B7]/20 px-1.5 py-0.5 rounded cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => setBody(prev => prev + '$PASSWORD_BLOCK$')}
                    >$PASSWORD_BLOCK$</code> - {t('configurations.email_template.var_password_block')} <span className="text-red-600 font-semibold">*</span>
                  </li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                  <span className="text-red-600 font-semibold">*</span> {t('configurations.email_template.required_variables_note')}
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
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

        {/* Right Column - Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-6 overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('configurations.email_template.preview')}
            </h2>

            {/* Preview Frame */}
            <div
              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100"
              style={{ height: '600px' }}
            >
              {previewLoading && !previewHtml ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {t('common:loading')}
                </div>
              ) : previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {t('configurations.email_template.preview_empty')}
                </div>
              )}
            </div>

            {/* Preview info */}
            <p className="text-xs text-gray-500 mt-3 text-center">
              {t('configurations.email_template.preview_description')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
