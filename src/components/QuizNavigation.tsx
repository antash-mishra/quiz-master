import React from 'react';
import { useQuiz } from '../context/QuizContext';

const QuizNavigation: React.FC = () => {
  const { quiz, quizState, nextQuestion, previousQuestion } = useQuiz();
  
  if (!quiz) return null;
  
  const isFirstQuestion = quizState.currentQuestionIndex === 0;
  const isLastQuestion = quizState.currentQuestionIndex === quiz.questions.length - 1;
  const currentQuestion = quiz.questions[quizState.currentQuestionIndex];
  const hasAnswered = Boolean(quizState.answers[currentQuestion.id]);
  
  return (
    <div className="flex justify-between mt-6">
      <button
        onClick={previousQuestion}
        disabled={isFirstQuestion}
        className={`px-6 py-3 rounded-xl text-lg font-medium transition-all duration-200 ${
          isFirstQuestion
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-blue-600 hover:bg-gray-50 border border-blue-200'
        }`}
      >
        Previous
      </button>
      
      <button
        onClick={nextQuestion}
        disabled={!hasAnswered}
        className={`px-8 py-3 rounded-xl text-lg font-medium transition-all duration-200 ${
          !hasAnswered
            ? 'bg-blue-300 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLastQuestion ? 'Finish Quiz' : 'Next'}
      </button>
    </div>
  );
};

export default QuizNavigation;