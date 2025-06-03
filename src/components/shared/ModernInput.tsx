import React, { forwardRef } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  ({ label, error, showPasswordToggle, icon: Icon, className = '', type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full rounded-xl border-2 transition-all duration-200
              ${Icon ? 'pl-10' : 'pl-4'} 
              ${showPasswordToggle ? 'pr-12' : 'pr-4'} 
              py-3 text-gray-900 placeholder-gray-500
              ${error 
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }
              focus:outline-none hover:border-gray-400
            `}
            {...props}
          />
          
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

ModernInput.displayName = 'ModernInput';

export default ModernInput; 