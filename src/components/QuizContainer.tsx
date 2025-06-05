import React, { useState, useEffect } from 'react';
import StudentRegistration from './StudentRegistration';
import Quiz from './Quiz';
import QuizSpecificResults from './QuizSpecificResults';
import { getQuizzes, getStudentQuizCompletion } from '../lib/db';
import LaTeXRenderer from './LaTeXRenderer';
import { CheckCircle, Eye, LogOut } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description?: string;
}

const QuizContainer: React.FC = () => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [viewingResults, setViewingResults] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const quizData = await getQuizzes();
        setQuizzes(quizData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load quizzes:", error);
        setLoading(false);
      }
    }
    
    loadQuizzes();
  }, []);

  useEffect(() => {
    loadCompletedQuizzes();
  }, [studentId]);

  const handleRegistration = (id: string, name: string) => {
    setStudentId(id);
    setStudentName(name);
  };

  const handleSignOut = () => {
    // Clear local state - with @react-oauth/google, this is sufficient
    // The Google OAuth session will be handled by the library
    setStudentId(null);
    setStudentName('');
    setCompletedQuizzes([]);
    setSelectedQuizId(null);
    setViewingResults(false);
  };

  const handleQuizSelect = (quizId: string) => {
    const isCompleted = completedQuizzes.includes(quizId);
    
    if (isCompleted) {
      // Show results for completed quiz
      setSelectedQuizId(quizId);
      setViewingResults(true);
    } else {
      // Start new quiz
      setSelectedQuizId(quizId);
      setViewingResults(false);
    }
  };

  const handleBackToQuizList = () => {
    setSelectedQuizId(null);
    setViewingResults(false);
    // Refresh completed quizzes when returning to list
    if (studentId) {
      loadCompletedQuizzes();
    }
  };

  const loadCompletedQuizzes = async () => {
    if (studentId) {
      try {
        const completed = await getStudentQuizCompletion(studentId);
        setCompletedQuizzes(completed);
      } catch (error) {
        console.error("Failed to load completed quizzes:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-3 md:p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-3 md:p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <p className="text-gray-600">No quizzes available.</p>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return <StudentRegistration onRegister={handleRegistration} />;
  }

  // Show quiz results if viewing results for a completed quiz
  if (selectedQuizId && viewingResults) {
    return (
      <QuizSpecificResults
        studentId={studentId}
        studentName={studentName}
        quizId={selectedQuizId}
        isStudentContext={true}
        onBack={handleBackToQuizList}
      />
    );
  }

  // Show quiz if taking a new quiz
  if (selectedQuizId && !viewingResults) {
    return <Quiz studentId={studentId} studentName={studentName} quizId={selectedQuizId} onBack={handleBackToQuizList} />;
  }

  // Show quiz selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">Welcome, {studentName}!</h2>
            <p className="text-sm md:text-base text-gray-600">Select a quiz to begin or view your results:</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const isCompleted = completedQuizzes.includes(quiz.id);
            
            return (
              <div
                key={quiz.id}
                className={`w-full text-left p-3 md:p-4 border rounded-xl transition-colors relative cursor-pointer ${
                  isCompleted
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                }`}
                onClick={() => handleQuizSelect(quiz.id)}
              >
                {isCompleted && (
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <div className="flex items-center gap-1 text-green-600 text-xs md:text-sm font-medium">
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Completed</span>
                    </div>
                  </div>
                )}
                
                <h3 className={`text-sm md:text-lg font-medium pr-16 ${
                  isCompleted ? 'text-green-700' : 'text-gray-800'
                }`}>
                  <LaTeXRenderer content={quiz.title} />
                </h3>
                
                {quiz.description && (
                  <p className={`text-xs md:text-sm mt-1 pr-16 ${
                    isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    <LaTeXRenderer content={quiz.description} inline={true} />
                  </p>
                )}
                
                {isCompleted ? (
                  <div className="flex items-center gap-1 mt-2 text-green-600">
                    <Eye className="w-3 h-3 md:w-4 md:h-4" />
                    <p className="text-xs font-medium">
                      Click to view your results
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    Click to start quiz
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizContainer;