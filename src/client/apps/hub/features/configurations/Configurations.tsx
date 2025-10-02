import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { BrandingConfiguration } from './BrandingConfiguration';

type ConfigurationSection = 'branding';

export const Configurations: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ConfigurationSection>('branding');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Open drawer with slide-in animation on mount
  useEffect(() => {
    setTimeout(() => setDrawerOpen(true), 100);
  }, []);

  const configOptions = [
    {
      id: 'branding' as ConfigurationSection,
      name: 'Branding',
      icon: Palette,
      description: 'Customize colors, logo, and company identity'
    }
  ];

  return (
    <div className="h-full flex">
      {/* Configuration Options Drawer - 20% width, full height */}
      <div
        className={`w-1/5 bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurations</h2>
          <nav className="space-y-2">
            {configOptions.map((option) => {
              const Icon = option.icon;
              const isActive = activeSection === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => setActiveSection(option.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-colors duration-200 ${
                    isActive
                      ? 'bg-purple-50/50 border border-purple-200/30 text-[#B725B7]'
                      : 'text-gray-700 hover:bg-purple-50/50 hover:text-[#B725B7]'
                  }`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-[#B725B7]' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${isActive ? 'text-[#B725B7]' : 'text-gray-900'}`}>
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area - 80% width */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeSection === 'branding' && <BrandingConfiguration />}
      </div>
    </div>
  );
};
