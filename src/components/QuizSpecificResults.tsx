import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentQuizResults } from '../lib/db';
import LaTeXRenderer from './LaTeXRenderer';
import { ArrowLeft, Trophy, CheckCircle, XCircle } from 'lucide-react';

interface QuizSpecificResultsProps {
  studentId?: string;
  studentName?: string;
  quizId?: string;
  isStudentContext?: boolean;
  onBack?: () => void;
}

interface Result {
  question_text: string;
  student_answer: string;
  correct_answer: string;
  is_correct: number;
  timestamp: string;
}

interface QuizInfo {
  title: string;
  description: string;
}

const QuizSpecificResults: React.FC<QuizSpecificResultsProps> = ({ 
  studentId: propStudentId, 
  studentName: propStudentName,
  quizId: propQuizId,
  isStudentContext = false,
  onBack
}) => {
  const { studentId: urlStudentId, quizId: urlQuizId } = useParams<{ studentId: string; quizId: string }>();
  const navigate = useNavigate();
  
  const studentId = propStudentId || urlStudentId;
  const quizId = propQuizId || urlQuizId;
  
  const [results, setResults] = useState<Result[]>([]);
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentId && quizId) {
      loadResults();
    }
  }, [studentId, quizId]);

  const loadResults = async () => {
    if (!studentId || !quizId) return;
    
    try {
      const { quiz, results: quizResults } = await getStudentQuizResults(studentId, quizId);
      setQuizInfo(quiz);
      setResults(quizResults);
    } catch (err) {
      setError('Failed to load quiz results. Please try again.');
      console.error('Error loading quiz results:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    if (results.length === 0) return 0;
    const correctAnswers = results.filter(r => r.is_correct).length;
    return Math.round((correctAnswers / results.length) * 100);
  };

  const handleGoBack = () => {
    // Check if we're in student context and have an onBack callback
    if ((isStudentContext || (propStudentId && propStudentName)) && onBack) {
      // Use the callback to properly handle going back
      onBack();
    } else {
      // If accessed via URL (could be admin context), use browser history
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600">Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h2>
          <p className="text-gray-600 mb-4">
            No quiz results found for {propStudentName || 'this student'}.
          </p>
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const score = calculateScore();
  const correctAnswers = results.filter(r => r.is_correct).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-3 md:px-4">
        {/* Header with back button */}
        <div className="mb-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8">
          {/* Quiz Info Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">
              <LaTeXRenderer content={quizInfo?.title || 'Quiz Results'} />
            </h1>
            {quizInfo?.description && (
              <p className="text-sm md:text-lg text-gray-600 mb-4">
                <LaTeXRenderer content={quizInfo.description} inline={true} />
              </p>
            )}
            {propStudentName && (
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Results for: <span className="font-medium">{propStudentName}</span>
              </p>
            )}
            
            {/* Score Display */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
                <div className="text-2xl md:text-4xl font-bold text-blue-600">
                  {score}%
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                {correctAnswers} of {results.length} questions correct
              </p>
              <div className="mt-2">
                <div className={`text-sm font-medium ${
                  score >= 80 ? 'text-green-600' : 
                  score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {score >= 80 ? 'Excellent!' : 
                   score >= 60 ? 'Good job!' : 'Keep practicing!'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
              Detailed Results
            </h3>
            
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 md:p-6 rounded-lg md:rounded-xl border-2 ${
                  result.is_correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-2 mb-2 md:mb-4">
                  {result.is_correct ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <h4 className="font-medium text-gray-800 text-sm md:text-base">
                    Q{index + 1}: <LaTeXRenderer content={result.question_text} inline={true} />
                  </h4>
                </div>
                
                <div className="ml-7 space-y-1 md:space-y-2 text-xs md:text-sm">
                  <p>
                    <span className="text-gray-600">Your answer: </span>
                    <span className={result.is_correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      <LaTeXRenderer content={result.student_answer} inline={true} />
                    </span>
                  </p>
                  
                  {!result.is_correct && result.correct_answer && (
                    <p>
                      <span className="text-gray-600">Correct answer: </span>
                      <span className="text-green-600 font-medium">
                        <LaTeXRenderer content={result.correct_answer} inline={true} />
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => {
                if ((isStudentContext || (propStudentId && propStudentName)) && onBack) {
                  onBack();
                } else {
                  navigate('/');
                }
              }}
              className="px-4 md:px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              Take Another Quiz
            </button>
            <button
              onClick={handleGoBack}
              className="px-4 md:px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSpecificResults; 