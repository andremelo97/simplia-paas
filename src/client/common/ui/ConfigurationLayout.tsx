import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ConfigurationOption<T extends string> {
  id: T;
  name: string;
  icon: LucideIcon;
  description: string;
}

interface ConfigurationLayoutProps<T extends string> {
  title?: string;
  options: ConfigurationOption<T>[];
  activeSection: T;
  onSectionChange: (section: T) => void;
  children: React.ReactNode;
}

export function ConfigurationLayout<T extends string>({
  title = 'Configurations',
  options,
  activeSection,
  onSectionChange,
  children
}: ConfigurationLayoutProps<T>) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Open drawer with slide-in animation on mount
  useEffect(() => {
    setTimeout(() => setDrawerOpen(true), 100);
  }, []);

  return (
    <div className="h-full flex">
      {/* Configuration Options Sidebar - 20% width, full height */}
      <div
        className={`w-1/5 bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
          <nav className="space-y-2">
            {options.map((option) => {
              const Icon = option.icon;
              const isActive = activeSection === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => onSectionChange(option.id)}
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
        {children}
      </div>
    </div>
  );
}

