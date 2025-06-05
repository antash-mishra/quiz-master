import React, { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  label?: string;
  name?: string;
}

const LaTeXInput: React.FC<LaTeXInputProps> = ({
  value,
  onChange,
  placeholder = "Enter text with LaTeX (use $...$ for inline math, $$...$$ for display math)",
  className = "",
  multiline = false,
  rows = 3,
  label,
  name
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [isLatexMode, setIsLatexMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Check if the text contains LaTeX syntax
  useEffect(() => {
    // More inclusive regex that matches:
    // - Complete patterns: $...$ and $$...$$
    // - Incomplete patterns: $, $$, $..., $$...
    const hasLatex = /\$/.test(value);
    setIsLatexMode(hasLatex);
  }, [value]);

  // Handle focus and blur events
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Only show LaTeX UI when focused AND in LaTeX mode
  const shouldShowLatexUI = isLatexMode && isFocused;

  // Parse and render LaTeX content
  const renderLatexContent = (text: string) => {
    if (!text) return null;

    try {
      // Split text by math delimiters while preserving them
      const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/);
      
      return parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math
          const mathContent = part.slice(2, -2);
          return <BlockMath key={index} math={mathContent} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math
          const mathContent = part.slice(1, -1);
          return <InlineMath key={index} math={mathContent} />;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      });
    } catch (error) {
      return <span className="text-red-500">LaTeX Error: {(error as Error).message}</span>;
    }
  };

  const insertLatexSymbol = (symbol: string) => {
    const textarea = document.querySelector(`[name="${name}"]`) as HTMLTextAreaElement | HTMLInputElement;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = value.substring(0, start) + symbol + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted symbol
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + symbol.length, start + symbol.length);
      }, 0);
    }
  };

  const commonSymbols = [
    { symbol: '$\\frac{a}{b}$', label: 'Fraction' },
    { symbol: '$\\sqrt{x}$', label: 'Square Root' },
    { symbol: '$x^2$', label: 'Superscript' },
    { symbol: '$x_1$', label: 'Subscript' },
    { symbol: '$\\alpha$', label: 'Alpha' },
    { symbol: '$\\beta$', label: 'Beta' },
    { symbol: '$\\pi$', label: 'Pi' },
    { symbol: '$\\theta$', label: 'Theta' },
    { symbol: '$\\sum$', label: 'Sum' },
    { symbol: '$\\int$', label: 'Integral' },
    { symbol: '$\\infty$', label: 'Infinity' },
    { symbol: '$\\pm$', label: 'Plus/Minus' }
  ];

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {/* LaTeX Toolbar */}
      {shouldShowLatexUI && (
        <div className="bg-gray-50 p-2 rounded-md border w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-600">Quick Symbols:</span>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              {showPreview ? 'Hide' : 'Show'}
            </button>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-6 gap-1 w-full">
            {commonSymbols.map((item, index) => (
              <button
                key={index}
                onClick={() => insertLatexSymbol(item.symbol)}
                className="flex flex-col items-center p-1 text-xs bg-white border rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[40px] w-full"
                title={item.label}
              >
                <div className="mb-0.5 text-xs">
                  {renderLatexContent(item.symbol)}
                </div>
                <span className="text-gray-500 text-xs truncate max-w-full">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-2 w-full">
        {multiline ? (
          <textarea
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={rows}
            className={`w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-xs ${className}`}
          />
        ) : (
          <input
            type="text"
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs ${className}`}
          />
        )}
        
        {/* LaTeX Syntax Help */}
        {shouldShowLatexUI && (
          <div className="text-xs text-gray-500 break-words">
            💡 Tip: Use $...$ for inline math, $$...$$ for display math
          </div>
        )}
      </div>

      {/* Live Preview */}
      {showPreview && shouldShowLatexUI && value && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 w-full">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-xs font-medium text-blue-700">Preview:</span>
          </div>
          <div className="text-xs text-gray-900 bg-white p-2 rounded border break-words overflow-wrap-anywhere">
            {renderLatexContent(value)}
          </div>
        </div>
      )}
    </div>
  );
};

export default LaTeXInput; 