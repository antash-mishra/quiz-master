import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Mic, Camera, PenTool, Edit, Save, X } from 'lucide-react';
import { Quiz, Question, QuestionType } from '../types';
import { addQuestionToQuiz, getQuizMetadata, getQuestions } from '../lib/db';
import SpeechQuizBuilder from './SpeechQuizBuilder';
import ImageQuizBuilder from './ImageQuizBuilder';
import LaTeXInput from './LaTeXInput';
import LaTeXRenderer from './LaTeXRenderer';

interface QuizQuestionsStepProps {
  quizId: string;
  quizMetadata: {
    id: string;
    title: string;
    description: string;
  };
  onComplete: (data: any, nextStep: number) => void;
  onBack: () => void;
}

const QuizQuestionsStep: React.FC<QuizQuestionsStepProps> = ({ 
  quizId, 
  quizMetadata, 
  onComplete, 
  onBack 
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
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
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Load existing questions from database on component mount
  useEffect(() => {
    const loadExistingQuestions = async () => {
      try {
        const existingQuestions = await getQuestions(quizId);
        // Map database types back to frontend types
        const mappedQuestions = existingQuestions.map(q => ({
          ...q,
          type: mapQuestionTypeFromDB(q.type) as QuestionType
        }));
        setQuestions(mappedQuestions);
      } catch (err) {
        console.error('Failed to load existing questions:', err);
      }
    };

    loadExistingQuestions();
  }, [quizId]);

  const mapQuestionTypeFromDB = (dbType: string): string => {
    switch (dbType) {
      case 'multiple_choice':
        return 'multiple-choice';
      case 'true_false':
        return 'true-false';
      case 'text':
        return 'subjective';
      default:
        return dbType;
    }
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

  const addQuestionToState = async (question: Question, showSuccess: boolean = true) => {
    try {
      setIsLoading(true);
      
      // Create a modified version of the question with DB-compatible type
      const dbQuestion = {
        ...question,
        type: mapQuestionTypeForDB(question.type)
      };
      
      // Add question to database
      await addQuestionToQuiz(quizId, dbQuestion);
      
      // Add to local state
      setQuestions(prevQuestions => [...prevQuestions, question]);

      setError('');
      
      if (showSuccess) {
        setSuccessMessage('Question added successfully');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to add question:', err);
      setError('Failed to add question. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!validateQuestion(currentQuestion)) {
      return;
    }

    const success = await addQuestionToState(currentQuestion);
    if (success) {
      // Reset form only after successful save
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
    }
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const startEditingQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setEditingQuestion({ ...questions[index] });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionIndex(null);
    setEditingQuestion(null);
  };

  const saveEditedQuestion = () => {
    if (editingQuestionIndex !== null && editingQuestion) {
      if (!validateQuestion(editingQuestion)) {
        return;
      }
      
      const newQuestions = [...questions];
      newQuestions[editingQuestionIndex] = editingQuestion;
      setQuestions(newQuestions);
      setEditingQuestionIndex(null);
      setEditingQuestion(null);
      setError('');
    }
  };

  const handleEditQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingQuestion) return;
    
    if (e.target.name === 'type') {
      const type = e.target.value as QuestionType;
      setEditingQuestion({
        ...editingQuestion,
        type,
        options: type === 'subjective' ? [] : editingQuestion.options,
      });
    } else {
      setEditingQuestion({ ...editingQuestion, [e.target.name]: e.target.value });
    }
  };

  const handleEditOptionChange = (index: number, value: string) => {
    if (!editingQuestion) return;
    
    const newOptions = [...editingQuestion.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const addEditOption = () => {
    if (!editingQuestion) return;
    
    setEditingQuestion({
      ...editingQuestion,
      options: [...editingQuestion.options, { id: crypto.randomUUID(), text: '' }],
    });
  };

  const removeEditOption = (index: number) => {
    if (!editingQuestion) return;
    
    const newOptions = editingQuestion.options.filter((_, i) => i !== index);
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleQuizData = async (quizData: Quiz) => {
    // Add all questions from speech/image input to database and local state
    if (quizData.questions.length > 0) {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      try {
        for (const question of quizData.questions) {
          await addQuestionToState(question, false);
        }
        
        const count = quizData.questions.length;
        setSuccessMessage(`Successfully added ${count} question${count > 1 ? 's' : ''} to your quiz`);
        
        // Clear success message after 4 seconds for multiple questions
        setTimeout(() => setSuccessMessage(''), 4000);
        
      } catch (err) {
        console.error('Failed to save questions from input mode:', err);
        setError('Failed to save some questions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCompleteQuiz = () => {
    if (questions.length === 0) {
      setError('Add at least one question to complete the quiz');
      return;
    }
    
    onComplete({ questions }, 3);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{quizMetadata.title}</h2>
        <p className="text-gray-600">{quizMetadata.description}</p>
        <div className="mt-4 text-sm text-gray-500">
          Questions added: {questions.length}
        </div>
      </div>

      {/* Input mode selector */}
      <div className="mb-8 flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => setInputMode('manual')}
          className={`flex items-center gap-2 py-3 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
            inputMode === 'manual' 
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
          }`}
        >
          <PenTool className="w-5 h-5" />
          Manual Input
        </button>
        <button
          onClick={() => setInputMode('speech')}
          className={`flex items-center gap-2 py-3 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
            inputMode === 'speech' 
              ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
          }`}
        >
          <Mic className="w-5 h-5" />
          Voice Input
        </button>
        <button
          onClick={() => setInputMode('image')}
          className={`flex items-center gap-2 py-3 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
            inputMode === 'image' 
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
          }`}
        >
          <Camera className="w-5 h-5" />
          Image Input
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving questions to database...
        </div>
      )}

      {inputMode === 'speech' ? (
        <SpeechQuizBuilder
          onQuizData={handleQuizData}
          isListening={isListening}
          setIsListening={setIsListening}
        />
      ) : inputMode === 'image' ? (
        <ImageQuizBuilder onQuizData={handleQuizData} />
      ) : (
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-6">Add New Question</h3>
          
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

                <div className="flex gap-4 items-end">
                  <button
                    onClick={addOption}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Add Option
                  </button>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer
                    </label>
                    <select
                      value={currentQuestion.correctAnswerId}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswerId: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400"
            >
              {isLoading ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </div>
      )}

      {/* Display added questions */}
      {questions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-6">Added Questions ({questions.length})</h3>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                {editingQuestionIndex === index ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div>
                      <LaTeXInput
                        label="Question Text"
                        name="text"
                        value={editingQuestion?.text || ''}
                        onChange={(value) => setEditingQuestion(editingQuestion ? { ...editingQuestion, text: value } : null)}
                        placeholder="Enter question text (you can use LaTeX for math: $E = mc^2$)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type
                      </label>
                      <select
                        name="type"
                        value={editingQuestion?.type}
                        onChange={handleEditQuestionChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="subjective">Subjective</option>
                      </select>
                    </div>

                    {editingQuestion?.type !== 'subjective' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options
                        </label>
                        <div className="space-y-2">
                          {editingQuestion?.options.map((option, optIndex) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={editingQuestion.correctAnswerId === option.id}
                                onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswerId: option.id })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <LaTeXInput
                                name={`option-${optIndex}`}
                                value={option.text}
                                onChange={(value) => handleEditOptionChange(optIndex, value)}
                                placeholder={`Option ${optIndex + 1} (use LaTeX for math: $x^2$)`}
                                className="flex-1"
                              />
                              {editingQuestion.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeEditOption(optIndex)}
                                  className="p-2 text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addEditOption}
                            className="mt-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Add Option
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={saveEditedQuestion}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEditingQuestion}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingQuestion(index)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                          title="Edit question"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeQuestion(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Remove question"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <LaTeXRenderer content={question.text} className="text-gray-800" />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Type: <span className="capitalize">{question.type.replace('-', ' ')}</span>
                    </div>
                    {question.options.length > 0 && (
                      <div className="space-y-1">
                        {question.options.map((option, optIndex) => (
                          <div key={option.id} className="flex items-center gap-2 text-sm">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                              question.correctAnswerId === option.id 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <LaTeXRenderer content={option.text} className="text-gray-700" />
                            {question.correctAnswerId === option.id && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Quiz Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCompleteQuiz}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          Complete Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizQuestionsStep; 