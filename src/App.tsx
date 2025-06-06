import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QuizProvider } from './context/QuizContext';
import QuizContainer from './components/QuizContainer';
import QuizResults from './components/QuizResults';
import QuizSpecificResults from './components/QuizSpecificResults';
import AdminLayout from './components/AdminLayout';
import { BookOpen } from 'lucide-react';
import { initializeDatabase } from './lib/db';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    initialize();
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 w-full">
          <header className="py-2 md:py-3 bg-white shadow-sm sticky top-0 z-10 w-full">
            <div className="container mx-auto px-3 md:px-4 w-full max-w-full">
              <div className="flex items-center gap-2 w-full max-w-full">
                <div className="bg-blue-600 text-white p-1.5 md:p-2 rounded-lg flex-shrink-0">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h1 className="text-lg md:text-2xl font-bold text-blue-600 truncate">QuizMaster</h1>
              </div>
            </div>
          </header>
          
          <main className="container mx-auto px-3 md:px-4 py-2 md:py-4 w-full max-w-full">
            <QuizProvider>
              <Routes>
                <Route path="/" element={<QuizContainer />} />
                <Route path="/quiz-results" element={<QuizResults />} />
                <Route path="/quiz-results/:quizId" element={<QuizSpecificResults />} />
                <Route path="/admin/*" element={<AdminLayout />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </QuizProvider>
          </main>
          
          <footer className="py-2 md:py-3 text-center text-gray-500 text-xs md:text-sm w-full">
            <p>© 2025 QuizMaster</p>
          </footer>
        </div>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;