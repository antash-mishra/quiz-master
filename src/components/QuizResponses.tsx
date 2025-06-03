import React, { useState, useEffect } from 'react';
import { Quiz } from '../types';
import { ClipboardList, ChevronDown, ChevronUp, Trash2, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { getQuizzes, getQuizWithQuestions, getQuizResponses, deleteQuiz as deleteQuizFromDb, getStudentsByIds } from '../lib/db';

interface QuizResponse {
  quizId: string;
  userId: string;
  timestamp: string;
  answers: Record<string, string>;
  score: number;
}

interface Student {
  id: string;
  name: string;
  created_at?: string;
}

const QuizResponses: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<QuizResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch quizzes from database
        const fetchedQuizzes = await getQuizzes();
        setQuizzes(fetchedQuizzes);
        
        // Fetch all responses from database
        const fetchedResponses = await getQuizResponses();
        setResponses(fetchedResponses);
        
        // Extract unique student IDs from responses
        const studentIds = [...new Set(fetchedResponses.map(response => response.userId))];
        
        // Fetch student details if there are any responses
        if (studentIds.length > 0) {
          const fetchedStudents = await getStudentsByIds(studentIds);
          
          // Convert to a map for easier lookup
          const studentMap: Record<string, Student> = {};
          fetchedStudents.forEach((student: any) => {
            studentMap[student.id] = {
              id: student.id,
              name: student.name,
              created_at: student.created_at
            };
          });
          
          setStudents(studentMap);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load quiz data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const getQuizById = (id: string) => quizzes.find(quiz => quiz.id === id);

  const getResponsesByQuiz = (quizId: string) => 
    responses.filter(response => response.quizId === quizId);

  const calculateAverageScore = (quizId: string) => {
    const quizResponses = getResponsesByQuiz(quizId);
    console.log('Quiz responses:', quizResponses);
    if (quizResponses.length === 0) return 0;
    return quizResponses.reduce((acc, curr) => acc + curr.score, 0) / quizResponses.length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get user name from the students map, or show partial ID if not found
  const getUserName = (userId: string) => {
    return students[userId]?.name || `${userId.substring(0, 6)}...`;
  };

  const toggleQuizExpansion = async (quizId: string) => {
    if (expandedQuiz === quizId) {
      // If already expanded, collapse it
      setExpandedQuiz(null);
      setSelectedResponse(null);
      setCurrentQuestionIndex(0);
      return;
    }
    
    // Only load full quiz data when expanding
    try {
      // First, get the detailed quiz with questions
      const quizWithQuestions = await getQuizWithQuestions(quizId);
      
      if (quizWithQuestions) {
        // Update the specific quiz in state with its full data
        setQuizzes(prevQuizzes => {
          return prevQuizzes.map(q => {
            if (q.id === quizId) {
              // Since we're having type issues, safely extract what we need
              const quizData = quizWithQuestions as any;
              
              // Transform the quizWithQuestions to match Quiz type
              return {
                id: quizData.id || quizId,
                title: quizData.title || 'Untitled Quiz',
                description: quizData.description || '',
                // Ensure questions is an array with the expected structure
                questions: Array.isArray(quizData.questions) 
                  ? quizData.questions
                  : []
              };
            }
            return q;
          });
        });
        
        // Expand this quiz
        setExpandedQuiz(quizId);
        setSelectedResponse(null);
        setCurrentQuestionIndex(0);
      } else {
        setError('Could not find the quiz details.');
      }
    } catch (err) {
      console.error('Error fetching quiz details:', err);
      setError('Failed to load quiz details.');
    }
  };

  const deleteQuiz = async (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        // Delete quiz from the database
        await deleteQuizFromDb(quizId);
        
        // Update local state
        setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
        setResponses(responses.filter(response => response.quizId !== quizId));
      } catch (err) {
        console.error('Error deleting quiz:', err);
        setError('Failed to delete quiz. Please try again.');
      }
    }
  };

  const viewResponseDetails = (response: QuizResponse) => {
    setSelectedResponse(response);
    setCurrentQuestionIndex(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderResponseDetails = () => {
    if (!selectedResponse || !expandedQuiz) return null;
    
    const quiz = getQuizById(selectedResponse.quizId);
    if (!quiz) return null;
    
    // Check if quiz.questions exists and has elements
    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 animate-fade-in">
          <div className="text-center text-gray-600">
            <p>No questions found for this quiz.</p>
          </div>
        </div>
      );
    }
    
    // Ensure currentQuestionIndex is within bounds
    const safeQuestionIndex = Math.min(currentQuestionIndex, quiz.questions.length - 1);
    
    const question = quiz.questions[safeQuestionIndex];
    if (!question) return null;
    
    const userAnswer = selectedResponse.answers[question.id];
    const userOption = question.options?.find(opt => opt.id === userAnswer);
    const correctOption = question.options?.find(opt => opt.id === question.correctAnswerId);
    const isCorrect = userAnswer === question.correctAnswerId;

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedResponse(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Responses</span>
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-600">Overall Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(selectedResponse.score)}`}>
              {selectedResponse.score}%
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Question {safeQuestionIndex + 1} of {quiz.questions.length}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={safeQuestionIndex === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                disabled={safeQuestionIndex === quiz.questions.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xl mb-4">{question.text}</p>
              {question.options && Array.isArray(question.options) && question.options.length > 0 ? (
                <div className="space-y-3">
                  {question.options.map(option => (
                    <div
                      key={option.id}
                      className={`p-4 rounded-lg border-2 ${
                        option.id === userAnswer && option.id === question.correctAnswerId
                          ? 'border-green-500 bg-green-50'
                          : option.id === userAnswer
                          ? 'border-red-500 bg-red-50'
                          : option.id === question.correctAnswerId
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.text}</span>
                        {option.id === userAnswer && option.id === question.correctAnswerId && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {option.id === userAnswer && option.id !== question.correctAnswerId && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        {option.id === question.correctAnswerId && option.id !== userAnswer && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600">No options available for this question.</div>
              )}
            </div>

            <div className={`mt-4 p-4 rounded-lg ${
              isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                </span>
              </div>
              <p className="mt-2 text-gray-600">
                {isCorrect
                  ? 'Great job! You selected the correct answer.'
                  : `The correct answer was: ${correctOption?.text || 'Not available'}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 md:py-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 px-1">Quiz Responses</h2>
      
      {loading ? (
        <div className="text-center p-4 md:p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading quiz data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center text-gray-600 p-4 md:p-8">
          No quizzes available yet.
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {quizzes.map(quiz => {
            const quizResponses = getResponsesByQuiz(quiz.id);
            const averageScore = calculateAverageScore(quiz.id);
            
            return (
              <div key={quiz.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div 
                  className="p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleQuizExpansion(quiz.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-0">
                      <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
                        <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-xl font-semibold text-gray-800">{quiz.title}</h3>
                        <p className="text-sm text-gray-600">{quizResponses.length} responses</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                      <div className="text-right">
                        <p className="text-xs md:text-sm text-gray-600">Average Score</p>
                        <p className="font-semibold text-base md:text-lg">{averageScore.toFixed(1)}%</p>
                      </div>
                      <button
                        onClick={(e) => deleteQuiz(quiz.id, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {expandedQuiz === quiz.id ? (
                        <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedQuiz === quiz.id && (
                  <div className="p-4 md:p-6 border-t border-gray-100">
                    {quizResponses.length === 0 ? (
                      <p className="text-center text-gray-600 py-4">No responses for this quiz yet.</p>
                    ) : selectedResponse ? (
                      renderResponseDetails()
                    ) : (
                      <div className="space-y-4">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {quizResponses.map(response => (
                                <tr 
                                  key={`${response.quizId}_${response.userId}_${response.timestamp}`}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {getUserName(response.userId)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className={`text-sm font-medium ${getScoreColor(response.score)}`}>
                                      {response.score}%
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(response.timestamp)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => viewResponseDetails(response)}
                                      className="text-blue-600 hover:text-blue-900 font-medium"
                                    >
                                      Details
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                          {quizResponses.map(response => (
                            <div
                              key={`${response.quizId}_${response.userId}_${response.timestamp}`}
                              className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex flex-col space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-gray-900 mb-1">
                                      {getUserName(response.userId)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatDate(response.timestamp)}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className={`text-lg font-bold ${getScoreColor(response.score)}`}>
                                      {response.score}%
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => viewResponseDetails(response)}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizResponses;