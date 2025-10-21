import React from 'react';
import { Outlet } from 'react-router-dom';
import { Palette, Mail, Clock } from 'lucide-react';
import { ConfigurationLayout, ConfigurationOption } from '@client/common/ui';
import { useTranslation } from 'react-i18next';

type ConfigurationSection = 'branding' | 'communication' | 'transcription';

export const Configurations: React.FC = () => {
  const { t } = useTranslation('hub');

  const configOptions: ConfigurationOption<ConfigurationSection>[] = [
    {
      id: 'branding',
      name: t('branding.title'),
      icon: Palette,
      description: t('branding.subtitle')
    },
    {
      id: 'communication',
      name: t('communication.title'),
      icon: Mail,
      description: t('communication.subtitle')
    },
    {
      id: 'transcription',
      name: t('configurations.transcription'),
      icon: Clock,
      description: t('configurations.transcription_description')
    }
  ];

  return (
    <ConfigurationLayout
      title={t('sidebar.configurations')}
      options={configOptions}
      basePath="/configurations"
    >
      <Outlet />
    </ConfigurationLayout>
  );
};
