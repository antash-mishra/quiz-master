import React from 'react';
import { useQuiz } from '../context/QuizContext';

const ProgressBar: React.FC = () => {
  const { quiz, quizState } = useQuiz();
  
  if (!quiz) return null;
  
  const totalQuestions = quiz.questions.length;
  const currentQuestion = quizState.currentQuestionIndex + 1;
  const progress = (currentQuestion / totalQuestions) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Question {currentQuestion} of {totalQuestions}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;