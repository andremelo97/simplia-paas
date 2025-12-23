import React from 'react';
import { Outlet } from 'react-router-dom';
import { Key } from 'lucide-react';
import { ConfigurationLayout, ConfigurationOption } from '@client/common/ui';

type SettingsSection = 'api-keys';

export const Settings: React.FC = () => {
  const configOptions: ConfigurationOption<SettingsSection>[] = [
    {
      id: 'api-keys',
      name: 'API Keys',
      icon: Key,
      description: 'Manage API keys for integrations'
    }
  ];

  return (
    <ConfigurationLayout
      title="Settings"
      options={configOptions}
      basePath="/settings"
    >
      <Outlet />
    </ConfigurationLayout>
  );
};
