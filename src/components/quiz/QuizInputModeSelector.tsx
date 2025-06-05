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
      activeClasses: 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200',
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
      activeClasses: 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200',
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
      activeClasses: 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200',
      iconActiveClasses: 'bg-purple-100 text-purple-600',
      textActiveClasses: 'text-purple-900',
      descActiveClasses: 'text-purple-700',
      indicatorClasses: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Choose Input Method
        </h3>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Select how you'd like to add questions to your quiz
        </p>
      </div>
      
      {/* Mobile: Stack vertically on small screens, Desktop: Grid on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`
                relative p-4 sm:p-5 lg:p-6 rounded-lg lg:rounded-xl border-2 transition-all duration-300 text-left
                hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActive 
                  ? `${mode.activeClasses} focus:ring-blue-500`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm focus:ring-gray-300'
                }
              `}
              aria-pressed={isActive}
              aria-label={`Select ${mode.name} input method`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`
                  p-2 sm:p-3 rounded-lg lg:rounded-xl transition-all duration-200 flex-shrink-0
                  ${isActive 
                    ? mode.iconActiveClasses
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`
                    text-base sm:text-lg font-semibold mb-1 transition-colors duration-200
                    ${isActive ? mode.textActiveClasses : 'text-gray-900'}
                  `}>
                    {mode.name}
                  </h4>
                  <p className={`
                    text-xs sm:text-sm transition-colors duration-200 leading-relaxed
                    ${isActive ? mode.descActiveClasses : 'text-gray-600'}
                  `}>
                    {mode.description}
                  </p>
                </div>
              </div>
              
              {isActive && (
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <div className={`
                    w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center
                    ${mode.indicatorClasses} shadow-sm
                  `}>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Mobile touch feedback */}
              <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-transparent pointer-events-none transition-colors duration-150 active:bg-black active:bg-opacity-5 sm:hidden" />
            </button>
          );
        })}
      </div>
    </div>
  );
} 