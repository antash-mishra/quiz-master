import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ content, className = "", inline = false }) => {
  // Parse and render LaTeX content
  const renderLatexContent = (text: string) => {
    if (!text) return null;

    try {
      // Split text by math delimiters while preserving them
      const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/);
      
      return parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math - force inline math for inline rendering
          const mathContent = part.slice(2, -2);
          return inline ? 
            <InlineMath key={index} math={mathContent} /> : 
            <BlockMath key={index} math={mathContent} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math
          const mathContent = part.slice(1, -1);
          return <InlineMath key={index} math={mathContent} />;
        } else {
          // Regular text - preserve line breaks only if not inline
          if (inline) {
            return <span key={index}>{part}</span>;
          } else {
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

  // Use span for inline rendering, div for block rendering
  const WrapperComponent = inline ? 'span' : 'div';

  return (
    <WrapperComponent className={`latex-content ${className}`}>
      {renderLatexContent(content)}
    </WrapperComponent>
  );
};

export default LaTeXRenderer; 