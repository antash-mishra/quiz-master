import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz as QuizType } from '../types';
import LaTeXRenderer from './LaTeXRenderer';
import { getQuestions, saveResponse, hasStudentCompletedQuiz } from '../lib/db';
import { CheckCircle, ArrowLeft, Eye } from 'lucide-react';

interface QuestionResponse {
  questionId: string;
  selectedOptionId: string;
  textAnswer: string;
  isCorrect: boolean;
}

interface QuizProps {
  quiz?: QuizType;
  quizId?: string;
  studentId?: string;
  studentName?: string;
  onBack?: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ quiz: propQuiz, quizId: propQuizId, studentId, studentName, onBack }) => {
  const { quizId: urlQuizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  // Use prop quizId if available, otherwise fall back to URL parameter
  const quizId = propQuizId || urlQuizId;
  
  const [quiz, setQuiz] = useState<QuizType | null>(propQuiz || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(!propQuiz);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(true);

  // Check if quiz is already completed
  useEffect(() => {
    const checkCompletion = async () => {
      if (!quizId || !studentId) {
        setCheckingCompletion(false);
        return;
      }
      
      try {
        const completed = await hasStudentCompletedQuiz(studentId, quizId);
        setIsCompleted(completed);
      } catch (err) {
        console.error('Error checking completion status:', err);
      } finally {
        setCheckingCompletion(false);
      }
    };

    checkCompletion();
  }, [quizId, studentId]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!quizId || propQuiz || isCompleted) {
        return;
      }
      
      try {
        const loadedQuestions = await getQuestions(quizId);
        
        if (!loadedQuestions || loadedQuestions.length === 0) {
          setError('No questions found for this quiz.');
          setLoading(false);
          return;
        }
        
        setQuiz({
          id: quizId,
          title: 'Quiz', // Default title
          description: '',
          questions: loadedQuestions
        });
        setLoading(false);
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to load questions. Please try again.');
        setLoading(false);
      }
    };

    if (!checkingCompletion && !isCompleted) {
      loadQuestions();
    }
  }, [quizId, propQuiz, isCompleted, checkingCompletion]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  const handleAnswerSelect = (optionId: string) => {
    if (!currentQuestion) return;
    
    const updatedResponses = [...responses];
    const existingResponseIndex = updatedResponses.findIndex(
      r => r.questionId === currentQuestion.id
    );

    const response: QuestionResponse = {
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
      textAnswer: '',
      isCorrect: optionId === currentQuestion.correctAnswerId
    };

    if (existingResponseIndex >= 0) {
      updatedResponses[existingResponseIndex] = response;
    } else {
      updatedResponses.push(response);
    }

    setResponses(updatedResponses);
  };

  const handleTextAnswer = (text: string) => {
    if (!currentQuestion) return;
    
    const updatedResponses = [...responses];
    const existingResponseIndex = updatedResponses.findIndex(
      r => r.questionId === currentQuestion.id
    );

    const response: QuestionResponse = {
      questionId: currentQuestion.id,
      selectedOptionId: '',
      textAnswer: text,
      isCorrect: false // Will be graded later for subjective questions
    };

    if (existingResponseIndex >= 0) {
      updatedResponses[existingResponseIndex] = response;
    } else {
      updatedResponses.push(response);
    }

    setResponses(updatedResponses);
  };

  const handleSubmit = async () => {
    if (!quizId) return;
    
    setIsSubmitting(true);
    try {
      for (const response of responses) {
        await saveResponse({
          studentId: studentId || 'current-student', // Use prop studentId if available
          quizId,
          questionId: response.questionId,
          textAnswer: response.textAnswer,
          selectedOptionId: response.selectedOptionId,
          isCorrect: response.isCorrect
        });
      }
      
      // Navigate back to homepage after completion
      navigate('/');
    } catch (err) {
      setError('Failed to submit quiz. Please try again.');
      console.error('Error submitting quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPrevious = () => {
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  };

  const goToNext = () => {
    setCurrentQuestionIndex(Math.min((quiz?.questions.length || 1) - 1, currentQuestionIndex + 1));
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  // Show loading while checking completion
  if (checkingCompletion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600">Checking quiz status...</p>
        </div>
      </div>
    );
  }

  // Show completion message if quiz is already completed
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Quiz Already Completed</h2>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              You have already completed this quiz. You cannot take it again.
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              But you can view your results to see how you did!
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                // Navigate to specific results page
                navigate('/quiz-results/specific', {
                  state: {
                    studentId: studentId,
                    studentName: studentName,
                    quizId: quizId
                  }
                });
              }}
              className="flex items-center gap-2 justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View My Results</span>
            </button>
            
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600">Quiz not found.</p>
        </div>
      </div>
    );
  }

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-3 md:px-4">
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-sm md:text-base text-gray-600">{quiz.description}</p>
          )}
          
          {/* Progress Bar */}
          <div className="mb-4 md:mb-6 mt-4">
            <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-1">
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <span className="text-xs md:text-sm font-medium text-gray-500">
                Q{currentQuestionIndex + 1}/{quiz.questions.length}
              </span>
              <span className="text-xs md:text-sm text-gray-500 capitalize">
                {currentQuestion.type.replace('-', ' ')}
              </span>
            </div>
            
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
              <LaTeXRenderer content={currentQuestion.text} inline={true} />
            </h2>

            {/* Question Image */}
            {currentQuestion.image && (
              <div className="mb-4 md:mb-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={currentQuestion.image}
                    alt="Question illustration"
                    className="w-full h-auto max-h-80 object-contain bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false' ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = responses.find(r => r.questionId === currentQuestion.id)?.selectedOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    className={`w-full text-left p-3 md:p-4 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs md:text-sm font-medium mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="text-sm md:text-base">
                        <LaTeXRenderer content={option.text} inline={true} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <textarea
                className="w-full p-3 md:p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm md:text-base"
                rows={4}
                placeholder="Enter your answer here..."
                value={responses.find(r => r.questionId === currentQuestion.id)?.textAnswer || ''}
                onChange={(e) => handleTextAnswer(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Quiz Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <button
            onClick={goToPrevious}
            disabled={isFirstQuestion}
            className={`px-4 md:px-6 py-3 rounded-xl text-sm md:text-lg font-medium transition-all duration-200 ${
              isFirstQuestion
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-gray-50 border border-blue-200'
            }`}
          >
            Previous
          </button>
          
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={responses.length !== quiz.questions.length || isSubmitting}
              className={`px-6 md:px-8 py-3 rounded-xl text-sm md:text-lg font-medium transition-all duration-200 ${
                responses.length !== quiz.questions.length || isSubmitting
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Finish Quiz'}
            </button>
          ) : (
            <button
              onClick={goToNext}
              className="px-6 md:px-8 py-3 rounded-xl text-sm md:text-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;