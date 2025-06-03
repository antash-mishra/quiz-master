import React from 'react';
import { FileText, Mic, Image, Edit3, Check } from 'lucide-react';

export type InputMode = 'manual' | 'speech' | 'image';

interface QuizInputModeSelectorProps {
  currentMode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

export default function QuizInputModeSelector({
  currentMode,
  onModeChange
}: QuizInputModeSelectorProps) {
  
  const modes = [
    {
      id: 'manual' as InputMode,
      name: 'Manual Entry',
      description: 'Type questions manually',
      icon: Edit3,
      activeClasses: 'border-blue-500 bg-blue-50 shadow-lg',
      iconActiveClasses: 'bg-blue-100 text-blue-600',
      textActiveClasses: 'text-blue-900',
      descActiveClasses: 'text-blue-700',
      indicatorClasses: 'bg-blue-500'
    },
    {
      id: 'speech' as InputMode,
      name: 'Speech Input',
      description: 'Speak your questions',
      icon: Mic,
      activeClasses: 'border-green-500 bg-green-50 shadow-lg',
      iconActiveClasses: 'bg-green-100 text-green-600',
      textActiveClasses: 'text-green-900',
      descActiveClasses: 'text-green-700',
      indicatorClasses: 'bg-green-500'
    },
    {
      id: 'image' as InputMode,
      name: 'Image Upload',
      description: 'Extract from images',
      icon: Image,
      activeClasses: 'border-purple-500 bg-purple-50 shadow-lg',
      iconActiveClasses: 'bg-purple-100 text-purple-600',
      textActiveClasses: 'text-purple-900',
      descActiveClasses: 'text-purple-700',
      indicatorClasses: 'bg-purple-500'
    }
  ];

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Choose Input Method
      </h3>
      <p className="text-gray-600 mb-6">
        Select how you'd like to add questions to your quiz
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 text-left
                transform hover:scale-105 hover:shadow-md
                ${isActive 
                  ? mode.activeClasses
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start space-x-4">
                <div className={`
                  p-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? mode.iconActiveClasses
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1">
                  <h4 className={`
                    text-lg font-semibold mb-1 transition-colors duration-200
                    ${isActive ? mode.textActiveClasses : 'text-gray-900'}
                  `}>
                    {mode.name}
                  </h4>
                  <p className={`
                    text-sm transition-colors duration-200
                    ${isActive ? mode.descActiveClasses : 'text-gray-600'}
                  `}>
                    {mode.description}
                  </p>
                </div>
              </div>
              
              {isActive && (
                <div className="absolute top-4 right-4">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    ${mode.indicatorClasses}
                  `}>
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 