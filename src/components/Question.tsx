import React from 'react';
import { Question as QuestionType } from '../types';
import { useQuiz } from '../context/QuizContext';

interface QuestionProps {
  question: QuestionType;
}

const Question: React.FC<QuestionProps> = ({ question }) => {
  const { quizState, answerQuestion } = useQuiz();
  const selectedAnswerId = quizState.answers[question.id] || '';

  const handleOptionSelect = (optionId: string) => {
    answerQuestion(question.id, optionId);
  };

  const handleSubjectiveAnswer = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    answerQuestion(question.id, event.target.value);
  };

  if (question.type === 'subjective') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full mx-auto animate-fade-in">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">{question.text}</h2>
        <textarea
          value={selectedAnswerId}
          onChange={handleSubjectiveAnswer}
          className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors"
          placeholder="Type your answer here..."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full mx-auto animate-fade-in">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{question.text}</h2>
      
      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionSelect(option.id)}
            className={`w-full text-left p-4 rounded-xl transition-all duration-200 border-2 ${
              selectedAnswerId === option.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <div 
                className={`w-6 h-6 flex items-center justify-center rounded-full border-2 mr-3 ${
                  selectedAnswerId === option.id 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : 'border-gray-400'
                }`}
              >
                {selectedAnswerId === option.id && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-lg">{option.text}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Question;