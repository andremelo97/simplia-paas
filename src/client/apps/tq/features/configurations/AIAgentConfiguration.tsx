import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import { Button, Card, Textarea, Alert, AlertDescription } from '@client/common/ui';
import { aiAgentConfigurationService, AIAgentConfigurationData } from '../../services/aiAgentConfigurationService';

export const AIAgentConfiguration: React.FC = () => {
  const { t } = useTranslation('tq');
  const [configuration, setConfiguration] = useState<AIAgentConfigurationData | null>(null);
  const [systemMessage, setSystemMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemMessageError, setSystemMessageError] = useState('');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiAgentConfigurationService.getConfiguration();
      setConfiguration(data);
      setSystemMessage(data.systemMessage);
      setSystemMessageError('');
    } catch (err) {
      console.error('Failed to load AI Agent configuration:', err);
      setError(t('configurations.ai_agent.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmedMessage = systemMessage.trim();

    if (!trimmedMessage) {
      setSystemMessageError(t('common:field_required'));
      return;
    }

    if (!trimmedMessage.includes('$transcription')) {
      setSystemMessageError(t('configurations.ai_agent.transcription_required'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updatedConfig = await aiAgentConfigurationService.updateConfiguration(trimmedMessage);
      setConfiguration(updatedConfig);
      setSystemMessage(updatedConfig.systemMessage);
      setSystemMessageError('');
    } catch (err) {
      console.error('Failed to update AI Agent configuration:', err);
      setError(t('configurations.ai_agent.failed_to_save'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(t('configurations.ai_agent.reset_confirm'))) return;

    try {
      setSaving(true);
      setError(null);
      const resetConfig = await aiAgentConfigurationService.resetConfiguration();
      setConfiguration(resetConfig);
      setSystemMessage(resetConfig.systemMessage);
      setSystemMessageError('');
    } catch (err) {
      console.error('Failed to reset AI Agent configuration:', err);
      setError(t('configurations.ai_agent.failed_to_reset'));
    } finally {
      setSaving(false);
    }
  };

  // Don't render form until data is loaded
  if (loading) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>{t('configurations.ai_agent.loading')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Bot className="h-6 w-6 text-[#B725B7]" />
          <h1 className="text-2xl font-bold text-gray-900">{t('configurations.ai_agent.page_title')}</h1>
        </div>
        <p className="text-gray-600">
          {t('configurations.ai_agent.page_description')}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Message */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('configurations.ai_agent.system_message_title')}
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {t('configurations.ai_agent.system_message_description')}
        </p>
        <Textarea
          value={systemMessage}
          onChange={(e) => {
            const value = e.target.value;
            setSystemMessage(value);
            const trimmedValue = value.trim();

            if (!trimmedValue) {
              if (systemMessageError) {
                setSystemMessageError(t('common:field_required'));
              }
            } else if (!trimmedValue.includes('$transcription')) {
              if (systemMessageError) {
                setSystemMessageError(t('configurations.ai_agent.transcription_required'));
              }
            } else if (systemMessageError) {
              setSystemMessageError('');
            }
          }}
          placeholder="Enter the system message for the AI Agent..."
          rows={20}
          disabled={saving}
          className="font-mono text-sm"
          helperText={t('configurations.ai_agent.available_variables') + ' $patient.first_name$, $patient.last_name$, $patient.fullName$, $date.now$, $session.created_at$, $transcription$, $me.first_name$, $me.last_name$, $me.fullName$'}
          required
          error={systemMessageError}
          requiredMessage={t('configurations.ai_agent.transcription_required')}
        />
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || !systemMessage.trim()}
        >
          {saving ? t('configurations.ai_agent.saving') : t('configurations.ai_agent.save_changes')}
        </Button>
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={saving}
        >
          {t('configurations.ai_agent.reset_to_default')}
        </Button>
      </div>

      {/* Last Updated Info */}
      {configuration && (
        <div className="text-sm text-gray-500">
          {t('configurations.ai_agent.last_updated')} {new Date(configuration.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};
