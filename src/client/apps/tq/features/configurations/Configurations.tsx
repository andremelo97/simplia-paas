import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import { ConfigurationLayout, ConfigurationOption } from '@client/common/ui';
import { AIAgentConfiguration } from './AIAgentConfiguration';

type ConfigurationSection = 'ai-agent';

export const Configurations: React.FC = () => {
  const { t } = useTranslation('tq');
  const [activeSection, setActiveSection] = useState<ConfigurationSection>('ai-agent');

  const configOptions: ConfigurationOption<ConfigurationSection>[] = [
    {
      id: 'ai-agent',
      name: t('configurations.ai_agent.menu_title'),
      icon: Bot,
      description: t('configurations.ai_agent.menu_description')
    }
  ];

  return (
    <ConfigurationLayout
      options={configOptions}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === 'ai-agent' && <AIAgentConfiguration />}
    </ConfigurationLayout>
  );
};

