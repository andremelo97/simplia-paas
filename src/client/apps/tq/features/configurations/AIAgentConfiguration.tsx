import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { Button, Card, Textarea, Alert, AlertDescription } from '@client/common/ui';
import { aiAgentConfigurationService, AIAgentConfigurationData } from '../../services/aiAgentConfigurationService';

const TRANSCRIPTION_REQUIRED_MESSAGE =
  'The $transcription$ variable is required to ensure the consultation transcription is sent to the agent.';

export const AIAgentConfiguration: React.FC = () => {
  const [configuration, setConfiguration] = useState<AIAgentConfigurationData | null>(null);
  const [systemMessage, setSystemMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState(false);

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
      setTranscriptionError(false);
    } catch (err) {
      console.error('Failed to load AI Agent configuration:', err);
      setError('Failed to load configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!systemMessage.includes('$transcription')) {
      setTranscriptionError(true);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updatedConfig = await aiAgentConfigurationService.updateConfiguration(systemMessage);
      setConfiguration(updatedConfig);
      setTranscriptionError(false);
    } catch (err) {
      console.error('Failed to update AI Agent configuration:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the AI Agent configuration to default?')) return;

    try {
      setSaving(true);
      setError(null);
      const resetConfig = await aiAgentConfigurationService.resetConfiguration();
      setConfiguration(resetConfig);
      setSystemMessage(resetConfig.systemMessage);
      setTranscriptionError(false);
    } catch (err) {
      console.error('Failed to reset AI Agent configuration:', err);
      setError('Failed to reset configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Don't render form until data is loaded
  if (loading) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>Loading AI Agent configuration...</AlertDescription>
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
          <h1 className="text-2xl font-bold text-gray-900">AI Agent Configuration</h1>
        </div>
        <p className="text-gray-600">
          Configure the AI Agent's behavior and initial system message
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Message</h2>
        <p className="text-sm text-gray-600 mb-4">
          This message defines how the AI Agent should behave and respond. It's the first message sent in every conversation
          to establish context and guidelines.
        </p>
        {transcriptionError && (
          <p className="text-sm font-medium text-red-600 mb-2">
            {TRANSCRIPTION_REQUIRED_MESSAGE}
          </p>
        )}
        <Textarea
          value={systemMessage}
          onChange={(e) => {
            const value = e.target.value;
            setSystemMessage(value);
            if (transcriptionError && value.includes('$transcription')) {
              setTranscriptionError(false);
            }
          }}
          placeholder="Enter the system message for the AI Agent..."
          rows={20}
          disabled={saving}
          className={`font-mono text-sm ${transcriptionError ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-0' : ''}`}
          helperText="Available variables: $patient.first_name$, $patient.last_name$, $patient.fullName$, $date.now$, $session.created_at$, $transcription$, $me.first_name$, $me.last_name$, $me.fullName$"
        />
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={saving || !systemMessage.trim()}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleReset}
          disabled={saving}
        >
          Reset to Default
        </Button>
      </div>

      {/* Last Updated Info */}
      {configuration && (
        <div className="text-sm text-gray-500">
          Last updated: {new Date(configuration.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

