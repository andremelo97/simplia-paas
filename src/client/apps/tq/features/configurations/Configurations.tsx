import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { ConfigurationLayout, ConfigurationOption } from '@client/common/ui';

type ConfigurationSection = 'email-template';

export const Configurations: React.FC = () => {
  const { t } = useTranslation('tq');

  const configOptions: ConfigurationOption<ConfigurationSection>[] = [
    {
      id: 'email-template',
      name: t('configurations.email_template.menu_title'),
      icon: Mail,
      description: t('configurations.email_template.menu_description')
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

