import React, { useState } from 'react';
import { Upload, X, Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Question } from '../types';
import { AI_PROVIDERS, AIProvider } from '../services/aiProviders';
import { useAIProcessing } from '../hooks/useAIProcessing';
import { QuestionEditor, QuestionDisplay } from './shared';

interface ImageQuizBuilderProps {
  onQuestionsExtracted: (questions: Question[]) => void;
  isLoading?: boolean;
}

export default function ImageQuizBuilder({ onQuestionsExtracted, isLoading }: ImageQuizBuilderProps) {
  const [images, setImages] = useState<File[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Use Gemini by default with API key from environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const provider: AIProvider['name'] = 'gemini';

  const [aiState, aiActions] = useAIProcessing({ apiKey, provider });
  const { isProcessing, error, extractedQuestions } = aiState;
  const { processImages, setError, setExtractedQuestions } = aiActions;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setError('Some files were skipped. Only image files are allowed.');
    }
    
    setImages(prev => [...prev, ...imageFiles]);
    setError('');
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessImages = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    const questions = await processImages(images);
    if (questions.length > 0) {
      setImages([]); // Clear images after successful processing
    }
  };

  const handleAddExtractedQuestions = () => {
    if (extractedQuestions.length === 0) {
      setError('No questions available to add');
      return;
    }
    onQuestionsExtracted(extractedQuestions);
    setExtractedQuestions([]);
  };

  // Question editing functions
  const startEditingQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setEditingQuestion({ ...extractedQuestions[index] });
    setError('');
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionIndex(null);
    setEditingQuestion(null);
    setError('');
  };

  const saveEditedQuestion = () => {
    if (editingQuestionIndex !== null && editingQuestion) {
      if (!validateQuestion(editingQuestion)) {
        return;
      }
      
      const newQuestions = [...extractedQuestions];
      newQuestions[editingQuestionIndex] = editingQuestion;
      setExtractedQuestions(newQuestions);
      
      setEditingQuestionIndex(null);
      setEditingQuestion(null);
      setError('');
    }
  };

  const removeExtractedQuestion = (index: number) => {
    const newQuestions = extractedQuestions.filter((_, i) => i !== index);
    setExtractedQuestions(newQuestions);
    
    // If we're editing the question being removed, cancel editing
    if (editingQuestionIndex === index) {
      cancelEditingQuestion();
    }
    // If we're editing a question after the removed one, adjust the index
    else if (editingQuestionIndex !== null && editingQuestionIndex > index) {
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  };

  const validateQuestion = (question: Question): boolean => {
    setError('');
    
    if (!question.text.trim()) {
      setError('Question text is required');
      return false;
    }

    if (question.type !== 'subjective') {
      if (!question.correctAnswerId) {
        setError('Please select a correct answer');
        return false;
      }

      if (question.options.some(opt => !opt.text.trim())) {
        setError('All options must have text');
        return false;
      }
    }

    return true;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 lg:mb-6">
          <div className="p-2 sm:p-3 bg-blue-500 rounded-lg flex-shrink-0">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Extract Questions from Images
            </h3>
            <p className="text-blue-700 text-sm sm:text-base mt-1">
              Powered by AI for instant question extraction
            </p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4 lg:mb-6 text-sm sm:text-base leading-relaxed">
          Upload images containing quiz questions and let AI extract them automatically. 
          You can edit or remove extracted questions before adding them to your quiz.
        </p>

        {/* Image Upload */}
        <div className="mb-4 lg:mb-6">
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
            Upload Images
          </label>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 sm:p-6 text-center bg-white hover:bg-blue-50 transition-colors duration-200">
            <div className="p-3 bg-blue-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 lg:mb-4 flex items-center justify-center">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 text-sm sm:text-base">
                Drop your images here, or{' '}
                <label className="text-blue-600 hover:text-blue-500 cursor-pointer font-semibold underline decoration-2 underline-offset-2">
                  browse
                  <input 
                    type="file" 
                    multiple
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
              </p>
              <p className="text-xs sm:text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
            </div>
          </div>
          
          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mt-3 lg:mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 sm:h-24 lg:h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-shadow duration-200"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 p-1 sm:p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                    {Math.round(image.size / 1024)}KB
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcessImages}
          disabled={isProcessing || images.length === 0 || !apiKey.trim()}
          className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              <span>Processing Images...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Extract Questions from {images.length} Image{images.length !== 1 ? 's' : ''}</span>
            </>
          )}
        </button>
        
        {/* Error Display */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 font-medium text-sm sm:text-base leading-relaxed">{error}</p>
            </div>
          </div>
        )}
      </div>
        
      {/* Extracted Questions */}
      {extractedQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 lg:mb-6">
            <div className="p-2 sm:p-3 bg-green-500 rounded-lg flex-shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                Extracted Questions ({extractedQuestions.length})
              </h3>
              <p className="text-green-700 text-sm sm:text-base mt-1">
                Review and edit questions before adding to your quiz
              </p>
            </div>
          </div>
          
          {/* Questions container - removed height constraints and improved overflow handling */}
          <div className="space-y-3 lg:space-y-4 w-full">
            {extractedQuestions.map((question, index) => (
              <div key={question.id} className="bg-white p-4 sm:p-6 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
                {editingQuestionIndex === index ? (
                  <QuestionEditor
                    question={editingQuestion!}
                    onChange={setEditingQuestion}
                    onSave={saveEditedQuestion}
                    onCancel={cancelEditingQuestion}
                    isEditing={true}
                    showSaveCancel={true}
                    error={error}
                  />
                ) : (
                  <QuestionDisplay
                    question={question}
                    index={index}
                    onEdit={startEditingQuestion}
                    onRemove={removeExtractedQuestion}
                    showActions={true}
                  />
                )}
              </div>
            ))}
          </div>
            
          <div className="mt-4 lg:mt-6 pt-4 border-t border-green-200">
            <button
              onClick={handleAddExtractedQuestions}
              disabled={isLoading || extractedQuestions.length === 0}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  <span>Adding Questions...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Add {extractedQuestions.length} Question{extractedQuestions.length !== 1 ? 's' : ''} to Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 