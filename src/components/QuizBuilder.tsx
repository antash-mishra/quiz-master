import React, { useState } from 'react';
import { Quiz, Question, QuestionType } from '../types';
import { useNavigate } from 'react-router-dom';
import { saveQuiz } from '../lib/db';
import SpeechQuizBuilder from './SpeechQuizBuilder';
import ImageQuizBuilder from './ImageQuizBuilder';
import LaTeXInput from './LaTeXInput';
import LaTeXRenderer from './LaTeXRenderer';

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
  const [inputMode, setInputMode] = useState<'manual' | 'speech' | 'image'>('manual');
  const [isListening, setIsListening] = useState(false);

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

  const handleSpeechQuizData = (quizData: Quiz) => {
    // If quiz data has a title/description and our current quiz doesn't, use it
    if (quizData.title && !quiz.title) {
      setQuiz(prevQuiz => ({
        ...prevQuiz,
        title: quizData.title,
        description: quizData.description
      }));
    } 
    
    // If there's at least one question, add it to our quiz
    if (quizData.questions.length > 0) {
      setQuiz(prevQuiz => ({
        ...prevQuiz,
        questions: [...prevQuiz.questions, ...quizData.questions]
      }));
    }
    
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
      {/* Input mode selector */}
      <div className="mb-4 flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setInputMode('manual')}
          className={`flex items-center gap-2 py-2 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
            inputMode === 'manual' 
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Manual Input
        </button>
        <button
          onClick={() => setInputMode('speech')}
          className={`flex items-center gap-2 py-2 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
            inputMode === 'speech' 
              ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          </svg>
          Voice Input
        </button>
        <button
          onClick={() => setInputMode('image')}
          className={`flex items-center gap-2 py-2 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
            inputMode === 'image' 
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          Image Input
        </button>
      </div>

      {inputMode === 'speech' ? (
        <SpeechQuizBuilder
          onQuizData={handleSpeechQuizData}
          isListening={isListening}
          setIsListening={setIsListening}
        />
      ) : inputMode === 'image' ? (
        <ImageQuizBuilder onQuizData={handleSpeechQuizData} />
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6">Create New Quiz</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <LaTeXInput
                  label="Quiz Title"
                  name="title"
                  value={quiz.title}
                  onChange={(value) => setQuiz({ ...quiz, title: value })}
                  placeholder="Enter quiz title"
                />
              </div>
              
              <div>
                <LaTeXInput
                  label="Description"
                  name="description"
                  value={quiz.description}
                  onChange={(value) => setQuiz({ ...quiz, description: value })}
                  placeholder="Enter quiz description"
                  multiline={true}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-bold mb-6">Add New Question</h3>
            
            <div className="space-y-6">
              <div>
                <LaTeXInput
                  label="Question Text"
                  name="text"
                  value={currentQuestion.text}
                  onChange={(value) => setCurrentQuestion({ ...currentQuestion, text: value })}
                  placeholder="Enter question text (you can use LaTeX for math: $E = mc^2$)"
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
                      <LaTeXInput
                        name={`option-${index}`}
                        value={option.text}
                        onChange={(value) => handleOptionChange(index, value)}
                        placeholder={`Option ${index + 1} (LaTeX supported: $\\frac{a}{b}$)`}
                        className="flex-1"
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
                  <LaTeXInput
                    label="Sample Answer (optional)"
                    name="sampleAnswer"
                    value={currentQuestion.sampleAnswer || ''}
                    onChange={(value) => setCurrentQuestion({ ...currentQuestion, sampleAnswer: value })}
                    placeholder="Enter a sample answer (LaTeX supported for equations)"
                    multiline={true}
                    rows={3}
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
        </>
      )}

      {quiz.questions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-8">
          <h3 className="text-lg md:text-xl font-bold mb-6">Quiz Questions ({quiz.questions.length})</h3>
          
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <h4 className="text-base md:text-lg font-medium text-gray-800 mb-2">
                    {index + 1}. <LaTeXRenderer content={question.text} />
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
                          <LaTeXRenderer content={option.text} /> {option.id === question.correctAnswerId && '(Correct)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {question.type === 'subjective' && question.sampleAnswer && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Sample Answer:</p>
                    <p className="text-sm text-gray-600 mt-1 italic">
                      <LaTeXRenderer content={question.sampleAnswer} />
                    </p>
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