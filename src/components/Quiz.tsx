import React, { useState, useEffect } from 'react';
import { getQuestions, saveResponse } from '../lib/db';
import QuizResults from './QuizResults';

interface QuizProps {
  studentId: string;
  studentName: string;
  quizId: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  correctAnswerId: string;
  sampleAnswer?: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

const Quiz: React.FC<QuizProps> = ({ studentId, studentName, quizId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [quizId]);

  const loadQuestions = async () => {
    try {
      const loadedQuestions = await getQuestions(quizId);
      setQuestions(loadedQuestions);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Error loading questions:', err);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please enter an answer');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    let isCorrect = false;
    
    if (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') {
      isCorrect = answer === currentQuestion.correctAnswerId;
    } else {
      // For text answers, simple comparison or more complex logic would go here
      isCorrect = answer.trim().toLowerCase() === currentQuestion.sampleAnswer?.toLowerCase();
    }

    try {
      await saveResponse({
        studentId,
        quizId,
        questionId: currentQuestion.id,
        textAnswer: currentQuestion.type === 'text' ? answer.trim() : undefined,
        selectedOptionId: (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') ? answer : undefined,
        isCorrect
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswer('');
        setError('');
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      setError('Failed to save your answer. Please try again.');
      console.error('Error saving response:', err);
    }
  };

  if (isCompleted) {
    return <QuizResults studentId={studentId} studentName={studentName} />;
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
        <div className="mb-8">
          <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {currentQuestion.text}
        </h2>

        <div className="space-y-4">
          {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={option.id}
                    name="quiz-option"
                    value={option.id}
                    checked={answer === option.id}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={option.id} className="text-gray-700">{option.text}</label>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label 
                htmlFor="answer" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Answer:
              </label>
              <input
                type="text"
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type your answer here"
              />
            </div>
          )}
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleSubmitAnswer}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;