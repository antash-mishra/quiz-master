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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Create New Quiz</h2>
        
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz description"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h3 className="text-xl font-bold mb-6">Add New Question</h3>
        
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <div key={option.id} className="flex gap-4">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    type="button"
                  >
                    Remove
                  </button>
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={currentQuestion.correctAnswerId === option.id}
                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswerId: option.id })}
                    className="w-6 h-6 text-blue-600"
                  />
                </div>
              ))}
              <button
                onClick={addOption}
                className="text-blue-600 hover:text-blue-700 font-medium"
                type="button"
              >
                + Add Option
              </button>
            </div>
          )}

          {currentQuestion.type === 'subjective' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Answer (Optional)
              </label>
              <textarea
                name="sampleAnswer"
                value={currentQuestion.sampleAnswer || ''}
                onChange={handleQuestionChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a sample answer"
                rows={3}
              />
            </div>
          )}

          <button
            onClick={addQuestion}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            Add Question
          </button>
        </div>
      </div>

      {quiz.questions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold mb-6">Added Questions</h3>
          <div className="space-y-4">
            {quiz.questions.map((q, index) => (
              <div key={q.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{q.text}</p>
                  <p className="text-sm text-gray-500">Type: {q.type}</p>
                </div>
                <button
                  onClick={() => removeQuestion(index)}
                  className="text-red-600 hover:text-red-700"
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={saveQuizToDatabase}
        disabled={isLoading}
        className={`w-full py-4 bg-green-600 text-white rounded-lg transition-colors font-medium ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
        }`}
        type="button"
      >
        {isLoading ? 'Saving Quiz...' : 'Save Quiz'}
      </button>
    </div>
  );
};

export default QuizBuilder;