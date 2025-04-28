import React, { useState } from 'react';
import { Quiz, Question, QuestionType } from '../types';
import { useNavigate } from 'react-router-dom';
import { saveQuiz } from '../lib/db';

const QuizBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz>({
    id: crypto.randomUUID(),
    title: '',
    description: '',
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: crypto.randomUUID(),
    text: '',
    type: 'multiple-choice',
    options: [
      { id: crypto.randomUUID(), text: '' },
      { id: crypto.randomUUID(), text: '' },
    ],
    correctAnswerId: '',
  });

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setQuiz({ ...quiz, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'type') {
      const type = e.target.value as QuestionType;
      setCurrentQuestion({
        ...currentQuestion,
        type,
        options: type === 'subjective' ? [] : currentQuestion.options,
      });
    } else {
      setCurrentQuestion({ ...currentQuestion, [e.target.name]: e.target.value });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { id: crypto.randomUUID(), text: '' }],
    });
  };

  const removeOption = (index: number) => {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const validateQuestion = (question: Question): boolean => {
    if (!question.text.trim()) {
      setError('Question text is required');
      return false;
    }

    if (question.type !== 'subjective') {
      if (!question.correctAnswerId) {
        setError('Please select a correct answer');
        return false;
      }

      if (question.options.some(opt => !opt.text.trim())) {
        setError('All options must have text');
        return false;
      }
    }

    return true;
  };

  const addQuestion = () => {
    if (!validateQuestion(currentQuestion)) {
      return;
    }

    setQuiz({
      ...quiz,
      questions: [...quiz.questions, currentQuestion],
    });

    setCurrentQuestion({
      id: crypto.randomUUID(),
      text: '',
      type: 'multiple-choice',
      options: [
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
      ],
      correctAnswerId: '',
    });

    setError('');
  };

  const removeQuestion = (index: number) => {
    const newQuestions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const mapQuestionTypeForDB = (type: string): string => {
    switch (type) {
      case 'multiple-choice':
        return 'multiple_choice';
      case 'true-false':
        return 'true_false';
      case 'subjective':
        return 'text';
      default:
        return type;
    }
  };

  const saveQuizToDatabase = async () => {
    if (!quiz.title.trim()) {
      setError('Quiz title is required');
      return;
    }

    if (quiz.questions.length === 0) {
      setError('Add at least one question');
      return;
    }

    try {
      setIsLoading(true);
      // Create a modified version of the quiz with DB-compatible types
      const dbQuiz = {
        ...quiz,
        questions: quiz.questions.map(q => ({
          ...q,
          type: mapQuestionTypeForDB(q.type)
        }))
      };
      await saveQuiz(dbQuiz);
      navigate('/');
    } catch (err) {
      console.error('Failed to save quiz:', err);
      setError('Failed to save quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-6">Create New Quiz</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              name="title"
              value={quiz.title}
              onChange={handleQuizChange}
              className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={quiz.description}
              onChange={handleQuizChange}
              className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz description"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-bold mb-6">Add New Question</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <input
              type="text"
              name="text"
              value={currentQuestion.text}
              onChange={handleQuestionChange}
              className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter question text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>
            <select
              name="type"
              value={currentQuestion.type}
              onChange={handleQuestionChange}
              className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="subjective">Subjective</option>
            </select>
          </div>

          {currentQuestion.type !== 'subjective' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Options
              </label>
              {currentQuestion.options.map((option, index) => (
                <div key={option.id} className="flex gap-2 md:gap-4">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={currentQuestion.options.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="mt-2 md:flex md:gap-4 space-y-3 md:space-y-0">
                <button
                  onClick={addOption}
                  className="w-full md:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Add Option
                </button>

                <div className="w-full md:flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <select
                    value={currentQuestion.correctAnswerId}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswerId: e.target.value })}
                    className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select correct answer</option>
                    {currentQuestion.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.text || `Option ${currentQuestion.options.indexOf(option) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentQuestion.type === 'subjective' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Answer (optional)
              </label>
              <textarea
                name="sampleAnswer"
                value={currentQuestion.sampleAnswer || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, sampleAnswer: e.target.value })}
                className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter a sample answer"
              />
            </div>
          )}

          <button
            onClick={addQuestion}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Add Question
          </button>
        </div>
      </div>

      {quiz.questions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-8">
          <h3 className="text-lg md:text-xl font-bold mb-6">Quiz Questions ({quiz.questions.length})</h3>
          
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <h4 className="text-base md:text-lg font-medium text-gray-800 mb-2">
                    {index + 1}. {question.text}
                  </h4>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label="Remove question"
                  >
                    Remove
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  Type: {question.type}
                </p>
                
                {question.type !== 'subjective' && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Options:</p>
                    <ul className="mt-1 pl-5 list-disc text-sm text-gray-600">
                      {question.options.map((option) => (
                        <li key={option.id} className={option.id === question.correctAnswerId ? 'font-semibold text-green-600' : ''}>
                          {option.text} {option.id === question.correctAnswerId && '(Correct)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {question.type === 'subjective' && question.sampleAnswer && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Sample Answer:</p>
                    <p className="text-sm text-gray-600 mt-1 italic">{question.sampleAnswer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={saveQuizToDatabase}
            disabled={isLoading}
            className="w-full mt-6 py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:bg-green-400"
          >
            {isLoading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizBuilder;