import React from 'react';
import { useQuiz } from '../context/QuizContext';

const Results: React.FC = () => {
  const { quiz, calculateResults, resetQuiz } = useQuiz();
  const results = calculateResults();
  
  if (!quiz) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-2">Quiz Results</h2>
      <p className="text-gray-600 text-center mb-8">{quiz.title}</p>
      
      <div className="flex justify-center mb-8">
        <div className="w-40 h-40 rounded-full border-8 border-blue-100 flex items-center justify-center">
          <div className="text-center">
            <span className={`text-4xl font-bold ${getScoreColor(results.score)}`}>
              {Math.round(results.score)}%
            </span>
            <p className="text-sm text-gray-500">Score</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Total Questions:</span>
          <span className="font-medium">{results.totalQuestions}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Correct Answers:</span>
          <span className="font-medium text-green-600">{results.correctAnswers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Incorrect Answers:</span>
          <span className="font-medium text-red-600">
            {results.totalQuestions - results.correctAnswers}
          </span>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        {results.questionResults.map((result, index) => {
          const question = quiz.questions.find((q) => q.id === result.questionId);
          const userAnswer = question?.options.find((o) => o.id === result.userAnswerId);
          const correctAnswer = question?.options.find((o) => o.id === result.correctAnswerId);
          
          return (
            <div 
              key={result.questionId} 
              className={`p-4 rounded-lg ${
                result.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  {result.isCorrect ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium mb-1">Question {index + 1}: {question?.text}</p>
                  <p className="text-sm text-gray-600">Your answer: {userAnswer?.text || 'Not answered'}</p>
                  {!result.isCorrect && (
                    <p className="text-sm text-green-600">Correct answer: {correctAnswer?.text}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={resetQuiz}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          Retake Quiz
        </button>
      </div>
    </div>
  );
};

export default Results;