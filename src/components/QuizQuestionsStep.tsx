import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Quiz, Question } from '../types';
import { QuizInputModeSelector, type InputMode } from './quiz';
import { useQuestionManagement } from '../hooks/useQuestionManagement';
import { QuestionEditor, QuestionDisplay } from './shared';
import ImageQuizBuilder from './ImageQuizBuilder';
import SpeechQuizBuilder from './SpeechQuizBuilder';

interface QuizQuestionsStepProps {
  quizId: string;
  quizMetadata: {
    id: string;
    title: string;
    description: string;
  };
  onComplete: (data: any, nextStep: number) => void;
  onBack: () => void;
}

export default function QuizQuestionsStep({ 
  quizId, 
  quizMetadata, 
  onComplete, 
  onBack 
}: QuizQuestionsStepProps) {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // Fix: Use array destructuring for the hook return
  const [questionState, questionActions] = useQuestionManagement({ 
    quizId: quizId 
  });
  
  const { questions, editingQuestionIndex, editingQuestion, isLoading, error } = questionState;
  const { 
    addQuestion, 
    removeQuestion, 
    updateQuestion, 
    startEditingQuestion, 
    cancelEditingQuestion,
    saveEditedQuestion,
    loadExistingQuestions,
    setError,
    createEmptyQuestion
  } = questionActions;

  // Initialize empty question for manual creation
  useEffect(() => {
    if (inputMode === 'manual' && !currentQuestion && editingQuestionIndex === null) {
      setCurrentQuestion(createEmptyQuestion());
    }
  }, [inputMode, currentQuestion, editingQuestionIndex, createEmptyQuestion]);

  // Load existing questions when component mounts
  useEffect(() => {
    loadExistingQuestions();
  }, [loadExistingQuestions]);

  // Clear success message after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAddQuestion = async (question: Question) => {
    const success = await addQuestion(question);
    if (success) {
      setSuccessMessage('Question added successfully!');
      if (editingQuestionIndex !== null) {
        cancelEditingQuestion();
      } else {
        // Reset for new question creation
        setCurrentQuestion(createEmptyQuestion());
      }
    }
  };

  const handleRemoveQuestion = async (index: number) => {
    removeQuestion(index);
    setSuccessMessage('Question removed successfully!');
  };

  const handleQuestionEdit = (index: number) => {
    startEditingQuestion(index);
    setCurrentQuestion(null); // Clear manual question when editing existing one
    setInputMode('manual');
  };

  const handleFinishQuiz = async () => {
    if (questions.length === 0) {
      setError('Please add at least one question to your quiz');
      return;
    }
    onComplete(null, 3); // Complete the quiz
  };

  const handleQuestionChange = (question: Question | null) => {
    if (editingQuestionIndex !== null) {
      // This should be handled by the editing question state, not here
    } else {
      // This is for new question creation
      setCurrentQuestion(question);
    }
    setError(''); // Clear any existing errors
  };

  const handleSaveOrAdd = async () => {
    if (editingQuestionIndex !== null && editingQuestion) {
      // Save edited question
      const saved = saveEditedQuestion();
      if (saved) {
        setCurrentQuestion(null);
      }
    } else if (currentQuestion) {
      // Add new question
      await handleAddQuestion(currentQuestion);
    }
  };

  const handleCancel = () => {
    if (editingQuestionIndex !== null) {
      cancelEditingQuestion();
      setCurrentQuestion(createEmptyQuestion()); // Reset to new question form
    } else {
      setCurrentQuestion(createEmptyQuestion()); // Reset new question form
    }
  };

  // Get the question to display in the editor
  const getDisplayQuestion = (): Question | null => {
    if (editingQuestionIndex !== null && editingQuestion) {
      return editingQuestion;
    }
    return currentQuestion;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 sm:p-8 rounded-2xl border border-gray-200">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Add Questions</h2>
        
        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          Choose how you'd like to add questions to your quiz. You can use multiple input methods.
        </p>

        {/* Input Mode Selector */}
        <QuizInputModeSelector
          currentMode={inputMode}
          onModeChange={setInputMode}
        />

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <p className="text-green-700 font-medium text-sm sm:text-base">{successMessage}</p>
      </div>
        )}

        {/* Error Message */}
      {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
        </div>
      )}

        {/* Input Mode Content */}
        <div className="mb-6">
          {inputMode === 'manual' && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                {editingQuestionIndex !== null ? 'Edit Question' : 'Create Question Manually'}
              </h3>
              
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {editingQuestionIndex !== null 
                  ? 'Make changes to your question below.'
                  : 'Fill out the form below to create a new question with LaTeX support for mathematical expressions.'
                }
              </p>

              {getDisplayQuestion() && (
                <QuestionEditor
                  question={getDisplayQuestion()!}
                onChange={handleQuestionChange}
                  error={error}
                />
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:space-y-0">
                    <button
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
                    >
                    Cancel
                    </button>

                  <button
                    onClick={handleSaveOrAdd}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{editingQuestionIndex !== null ? 'Saving...' : 'Adding...'}</span>
                      </>
                    ) : (
                      <span>{editingQuestionIndex !== null ? 'Save Changes' : 'Add Question'}</span>
                    )}
                  </button>
                </div>
                </div>
              </div>
            )}

          {inputMode === 'image' && (
            <ImageQuizBuilder
              onQuestionsExtracted={async (questions: Question[]) => {
                for (const question of questions) {
                  await handleAddQuestion(question);
                }
                setSuccessMessage(`${questions.length} question${questions.length !== 1 ? 's' : ''} added from images!`);
              }}
              isLoading={isLoading}
            />
          )}

          {inputMode === 'speech' && (
            <SpeechQuizBuilder
              onQuestionAdded={async (question: Question) => {
                await handleAddQuestion(question);
                setSuccessMessage('Question added from speech!');
              }}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Quiz Questions ({questions.length})
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Review and manage your questions
              </p>
            </div>

            <button
              onClick={handleFinishQuiz}
              disabled={isLoading || questions.length === 0}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Finishing...</span>
                </>
              ) : (
                <span>Finish Quiz ({questions.length} questions)</span>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <QuestionDisplay
                  question={question}
                  index={index}
                  onEdit={handleQuestionEdit}
                  onRemove={handleRemoveQuestion}
                  showActions={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
        >
          ← Back to Quiz Details
        </button>
        
        {questions.length > 0 && (
          <button
            onClick={handleFinishQuiz}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Finishing Quiz...</span>
              </>
            ) : (
              <span>Complete Quiz with {questions.length} Questions</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
} 