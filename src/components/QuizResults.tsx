import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getStudentResults } from '../lib/db';
import LaTeXRenderer from './LaTeXRenderer';

interface QuizResultsProps {
  studentId: string;
  studentName: string;
}

interface Result {
  question_text: string;
  student_answer: string;
  correct_answer: string;
  is_correct: number;
  timestamp: string;
}

const QuizResultsContent: React.FC<QuizResultsProps> = ({ studentId, studentName }) => {
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResults();
  }, [studentId]);

  const loadResults = async () => {
    try {
      const studentResults = await getStudentResults(studentId);
      setResults(studentResults);
    } catch (err) {
      setError('Failed to load results. Please try again.');
      console.error('Error loading results:', err);
    }
  };

  const calculateScore = () => {
    if (results.length === 0) return 0;
    const correctAnswers = results.filter(r => r.is_correct).length;
    return (correctAnswers / results.length) * 100;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz Results</h1>
          <p className="text-gray-600 mb-6">No quiz results found for {studentName}.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take a Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-3 md:px-4">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
            <p className="text-sm md:text-lg text-gray-600 mb-4">
              Great job, {studentName}!
            </p>
            <div className="bg-blue-50 rounded-xl p-4 md:p-6">
              <div className="text-2xl md:text-4xl font-bold text-blue-600 mb-2">
                {calculateScore()}%
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                {results.filter(r => r.is_correct).length} of {results.length} correct
              </p>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 md:p-6 rounded-lg md:rounded-xl border-2 ${
                  result.is_correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <h3 className="font-medium text-gray-800 mb-2 md:mb-4 text-sm md:text-base">
                  Q{index + 1}: <LaTeXRenderer content={result.question_text} />
                </h3>
                
                <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                  <p>
                    <span className="text-gray-600">Your answer: </span>
                    <span className={result.is_correct ? 'text-green-600' : 'text-red-600'}>
                      <LaTeXRenderer content={result.student_answer} />
                    </span>
                  </p>
                  
                  {!result.is_correct && (
                    <p>
                      <span className="text-gray-600">Correct: </span>
                      <span className="text-green-600">
                        <LaTeXRenderer content={result.correct_answer} />
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 md:mt-8 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 md:px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component that gets data from navigation state
const QuizResults: React.FC = () => {
  const location = useLocation();
  const state = location.state as { studentId: string; studentName: string } | null;

  // Redirect to home if no state is provided
  if (!state || !state.studentId || !state.studentName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-3 md:p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <p className="text-red-600 text-sm md:text-base">No quiz results found. Please complete a quiz first.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 md:px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <QuizResultsContent studentId={state.studentId} studentName={state.studentName} />;
};

export default QuizResults;