import React, { useState } from 'react';
import { Palette, Mail } from 'lucide-react';
import { ConfigurationLayout, ConfigurationOption } from '@client/common/ui';
import { BrandingConfiguration } from './BrandingConfiguration';
import { CommunicationConfiguration } from './CommunicationConfiguration';
import { useTranslation } from 'react-i18next';

type ConfigurationSection = 'branding' | 'communication';

export const Configurations: React.FC = () => {
  const { t } = useTranslation('hub');
  const [activeSection, setActiveSection] = useState<ConfigurationSection>('branding');

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
    }
  ];

  return (
    <ConfigurationLayout
      title={t('sidebar.configurations')}
      options={configOptions}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === 'branding' && <BrandingConfiguration />}
      {activeSection === 'communication' && <CommunicationConfiguration />}
    </ConfigurationLayout>
  );
};
