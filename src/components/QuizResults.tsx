import React, { useState, useEffect } from 'react';
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

const QuizResults: React.FC<QuizResultsProps> = ({ studentId, studentName }) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz Results</h1>
        <p className="text-gray-600 mb-6">Thank you for completing the quiz, {studentName}!</p>

        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Your Score</p>
            <p className="text-4xl font-bold text-blue-600">{calculateScore().toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">
              {results.filter(r => r.is_correct).length} out of {results.length} correct
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border-2 ${
                result.is_correct
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <h3 className="font-medium text-gray-800 mb-4">
                Question {index + 1}: <LaTeXRenderer content={result.question_text} />
              </h3>
              
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Your answer: </span>
                  <span className={result.is_correct ? 'text-green-600' : 'text-red-600'}>
                    <LaTeXRenderer content={result.student_answer} />
                  </span>
                </p>
                
                {!result.is_correct && (
                  <p>
                    <span className="text-gray-600">Correct answer: </span>
                    <span className="text-green-600">
                      <LaTeXRenderer content={result.correct_answer} />
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;