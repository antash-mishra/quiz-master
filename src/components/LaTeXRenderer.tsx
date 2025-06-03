import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXRendererProps {
  content: string;
  className?: string;
}

const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ content, className = "" }) => {
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
          // Regular text - preserve line breaks
          return (
            <span key={index}>
              {part.split('\n').map((line, lineIndex, array) => (
                <React.Fragment key={lineIndex}>
                  {line}
                  {lineIndex < array.length - 1 && <br />}
                </React.Fragment>
              ))}
            </span>
          );
        }
      });
    } catch (error) {
      return (
        <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-sm">
          LaTeX Error: {(error as Error).message}
        </span>
      );
    }
  };

  return (
    <div className={`latex-content ${className}`}>
      {renderLatexContent(content)}
    </div>
  );
};

export default LaTeXRenderer; 