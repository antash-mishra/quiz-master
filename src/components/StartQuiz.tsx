import React from 'react';
import { useQuiz } from '../context/QuizContext';
import { Quiz } from '../types';

interface StartQuizProps {
  quiz: Quiz;
}

const StartQuiz: React.FC<StartQuizProps> = ({ quiz }) => {
  const { setQuiz, resetQuiz } = useQuiz();
  
  const handleStartQuiz = () => {
    resetQuiz();
    setQuiz(quiz);
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{quiz.title}</h1>
        <p className="text-gray-600">{quiz.description}</p>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Questions:</span>
          <span className="font-medium">{quiz.questions.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated time:</span>
          <span className="font-medium">{quiz.questions.length * 30} seconds</span>
        </div>
      </div>
      
      <div className="text-center">
        <button
          onClick={handleStartQuiz}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
};

export default StartQuiz;