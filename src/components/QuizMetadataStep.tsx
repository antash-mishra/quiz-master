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
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Quiz</h2>
        <p className="text-gray-600">Start by giving your quiz a title and description. You can use LaTeX notation for mathematical expressions.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400"
          >
            {isLoading ? 'Saving...' : 'Continue to Questions'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">💡 LaTeX Tips</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Use <code>{'$...$'}</code> for inline math: <code>{'$E = mc^2$'}</code></p>
          <p>• Use <code>{'$$...$$'}</code> for display math: <code>{'$$\\frac{x}{y}$$'}</code></p>
          <p>• Common symbols: <code>{'\\alpha'}</code>, <code>{'\\beta'}</code>, <code>{'\\gamma'}</code>, <code>{'\\pi'}</code></p>
          <p>• Fractions: <code>{'\\frac{numerator}{denominator}'}</code></p>
        </div>
      </div>
    </div>
  );
};

export default QuizMetadataStep; 