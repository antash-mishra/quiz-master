import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import LaTeXInput from './LaTeXInput';
import { saveQuizMetadata } from '../lib/db';

interface QuizMetadataStepProps {
  onComplete: (data: any, nextStep: number) => void;
  initialData: {
    id: string;
    title: string;
    description: string;
  };
}

const QuizMetadataStep: React.FC<QuizMetadataStepProps> = ({ onComplete, initialData }) => {
  const [formData, setFormData] = useState(initialData);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Quiz title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Save quiz metadata to database
      await saveQuizMetadata(formData);
      
      // Move to next step
      onComplete(formData, 2);
    } catch (err) {
      console.error('Failed to save quiz metadata:', err);
      setError('Failed to save quiz metadata. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">Create Your Quiz</h2>
        <p className="text-sm md:text-base text-gray-600">Give your quiz a title and description. LaTeX notation supported.</p>
      </div>

      {error && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm md:text-base">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div>
          <LaTeXInput
            label="Quiz Title"
            name="title"
            value={formData.title}
            onChange={(value) => setFormData({ ...formData, title: value })}
            placeholder="Enter quiz title (e.g., 'Introduction to $\\mathcal{F}=ma$')"
          />
        </div>

        <div>
          <LaTeXInput
            label="Description"
            name="description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Describe what this quiz covers (LaTeX supported: $E = mc^2$)"
            multiline={true}
            rows={4}
          />
        </div>

        <div className="flex justify-end pt-4 md:pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 text-sm md:text-base"
          >
            {isLoading ? 'Saving...' : 'Continue to Questions'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="mt-6 md:mt-8 p-3 md:p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2 text-sm md:text-base">💡 LaTeX Tips</h3>
        <div className="text-xs md:text-sm text-gray-600 space-y-1">
          <p>• Inline math: <code>{'$E = mc^2$'}</code></p>
          <p>• Display math: <code>{'$$\\frac{x}{y}$$'}</code></p>
          <p>• Symbols: <code>{'\\alpha, \\beta, \\pi'}</code></p>
        </div>
      </div>
    </div>
  );
};

export default QuizMetadataStep; 