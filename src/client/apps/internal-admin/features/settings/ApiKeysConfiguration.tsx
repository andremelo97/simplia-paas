import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check, AlertCircle } from 'lucide-react';
import { Button, Card, Input } from '@client/common/ui';
import { ApiKeysService, ApiKey } from '../../services/apiKeys';

export const ApiKeysConfiguration: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);

  // Newly created key (shown once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);

  // Visibility toggles for each key
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Copy feedback
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const keys = await ApiKeysService.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error('Failed to load API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      const key = await ApiKeysService.createApiKey({
        name: newKeyName.trim(),
        scope: 'provisioning'
      });
      setNewlyCreatedKey(key);
      setApiKeys(prev => [key, ...prev]);
      setNewKeyName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create API key:', err);
      setError('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return;
    }

    try {
      await ApiKeysService.revokeApiKey(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
      if (newlyCreatedKey?.id === id) {
        setNewlyCreatedKey(null);
      }
    } catch (err) {
      console.error('Failed to revoke API key:', err);
      setError('Failed to revoke API key');
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return key;
    return key.substring(0, 12) + '•'.repeat(key.length - 12);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">
            Manage API keys for external integrations (N8N, Zapier, etc.)
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <Card className="p-4 border-2 border-[#B725B7] border-dashed">
          <h3 className="font-medium text-gray-900 mb-4">Generate New API Key</h3>
          <div className="flex gap-4">
            <Input
              placeholder="Key name (e.g., N8N Production)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!newKeyName.trim() || creating}
            >
              {creating ? 'Generating...' : 'Generate'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setNewKeyName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Newly created key alert */}
      {newlyCreatedKey?.key && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-800">API Key Generated Successfully</h3>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-green-300 p-3 mt-3">
                <code className="flex-1 font-mono text-sm text-gray-900 break-all">
                  {newlyCreatedKey.key}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newlyCreatedKey.key!, 'new')}
                >
                  {copiedKeyId === 'new' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Keys list */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No API Keys</h3>
            <p className="text-gray-500">
              Generate your first API key to start integrating with external services.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4 flex items-center gap-4">
                {/* Key icon and info */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Key className="h-5 w-5 text-[#B725B7]" />
                  </div>
                </div>

                {/* Key details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{key.name}</h4>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {key.scope}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="font-mono">
                      {visibleKeys[key.id] && key.key
                        ? key.key
                        : maskKey(key.keyPrefix + '...')}
                    </span>
                    {key.key && (
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {visibleKeys[key.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>Created: {formatDate(key.createdAt)}</span>
                    <span>Last used: {formatDate(key.lastUsedAt)}</span>
                    {key.expiresAt && (
                      <span className="text-amber-600">
                        Expires: {formatDate(key.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {key.key && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(key.key!, key.id)}
                    >
                      {copiedKeyId === key.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(key.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Usage instructions */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">How to use API Keys</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>Include the API key in the <code className="bg-gray-200 px-1 rounded">x-api-key</code> header of your requests:</p>
          <pre className="bg-gray-800 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs">
{`curl -X POST https://api.livocare.ai/api/provisioning/signup \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: livo_your_api_key_here" \\
  -d '{
    "tenantName": "Clínica ABC",
    "adminEmail": "admin@clinica.com",
    "adminFirstName": "João",
    "adminLastName": "Silva",
    "adminPhone": "+5511999999999",
    "timezone": "America/Sao_Paulo",
    "planSlug": "starter",
    "seatsPurchased": 1,
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": "sub_xxx",
    "address": {
      "line1": "Rua Example, 123",
      "line2": "Sala 45",
      "city": "São Paulo",
      "state": "SP",
      "postalCode": "01234-567",
      "country": "BR"
    }
  }'`}
          </pre>
        </div>
      </Card>
    </div>
  );
};
