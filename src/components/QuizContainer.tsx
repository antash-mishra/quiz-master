import React, { useState, useEffect } from 'react';
import StudentRegistration from './StudentRegistration';
import Quiz from './Quiz';
import { getQuizzes } from '../lib/db';

interface Quiz {
  id: string;
  title: string;
  description?: string;
}

const QuizContainer: React.FC = () => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
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

  const handleRegistration = (id: string, name: string) => {
    setStudentId(id);
    setStudentName(name);
  };

  const handleQuizSelect = (quizId: string) => {
    setSelectedQuizId(quizId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600">No quizzes available at the moment.</p>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return <StudentRegistration onRegister={handleRegistration} />;
  }

  // Show quiz selection screen
  if (!selectedQuizId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {studentName}!</h2>
          <p className="text-gray-600 mb-6">Please select a quiz to begin:</p>
          
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => handleQuizSelect(quiz.id)}
                className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <h3 className="text-lg font-medium text-gray-800">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <Quiz studentId={studentId} studentName={studentName} quizId={selectedQuizId} />;
};

export default QuizContainer;