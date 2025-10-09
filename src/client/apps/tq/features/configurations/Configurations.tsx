import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { ConfigurationLayout, ConfigurationOption } from '@client/common/ui';
import { AIAgentConfiguration } from './AIAgentConfiguration';

type ConfigurationSection = 'ai-agent';

export const Configurations: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ConfigurationSection>('ai-agent');

  const configOptions: ConfigurationOption<ConfigurationSection>[] = [
    {
      id: 'ai-agent',
      name: 'AI Agents',
      icon: Bot,
      description: 'Configure AI Agent behavior and system prompts'
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

