import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Brain, Cpu, Sparkles, Check } from 'lucide-react';
import { AIProvider } from '../../services/aiProviders';

interface AIProviderSelectorProps {
  value: AIProvider['name'];
  onChange: (provider: AIProvider['name']) => void;
  className?: string;
}

const providerConfig = {
  openai: {
    icon: Brain,
    color: 'emerald',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-800',
    iconClass: 'text-emerald-600',
    hoverClass: 'hover:bg-emerald-100'
  },
  anthropic: {
    icon: Cpu,
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-800',
    iconClass: 'text-orange-600',
    hoverClass: 'hover:bg-orange-100'
  },
  gemini: {
    icon: Sparkles,
    color: 'blue',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    iconClass: 'text-blue-600',
    hoverClass: 'hover:bg-blue-100'
  }
};

const providers: Array<{ name: AIProvider['name']; displayName: string }> = [
  { name: 'openai', displayName: 'OpenAI GPT-4' },
  { name: 'anthropic', displayName: 'Anthropic Claude' },
  { name: 'gemini', displayName: 'Google Gemini' }
];

export default function AIProviderSelector({ value, onChange, className = '' }: AIProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProvider = providers.find(p => p.name === value) || providers[0];
  const selectedConfig = providerConfig[selectedProvider.name];
  const SelectedIcon = selectedConfig.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (provider: AIProvider['name']) => {
    onChange(provider);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        AI Provider
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full p-3 rounded-xl border-2 transition-all duration-200
          flex items-center justify-between
          ${selectedConfig.bgClass} ${selectedConfig.borderClass}
          hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-white ${selectedConfig.borderClass}`}>
            <SelectedIcon className={`h-5 w-5 ${selectedConfig.iconClass}`} />
          </div>
          <span className={`font-medium ${selectedConfig.textClass}`}>
            {selectedProvider.displayName}
          </span>
        </div>
        
        <ChevronDown 
          className={`h-5 w-5 transition-transform duration-200 ${selectedConfig.iconClass} ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {providers.map((provider) => {
            const config = providerConfig[provider.name];
            const Icon = config.icon;
            const isSelected = value === provider.name;
            
            return (
              <button
                key={provider.name}
                type="button"
                onClick={() => handleSelect(provider.name)}
                className={`
                  w-full p-4 flex items-center justify-between text-left
                  transition-colors duration-150
                  ${isSelected ? `${config.bgClass} ${config.borderClass}` : 'hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-white' : 'bg-gray-100'} ${isSelected ? config.borderClass : ''}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? config.iconClass : 'text-gray-600'}`} />
                  </div>
                  <span className={`font-medium ${isSelected ? config.textClass : 'text-gray-900'}`}>
                    {provider.displayName}
                  </span>
                </div>
                
                {isSelected && (
                  <Check className={`h-5 w-5 ${config.iconClass}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
} 