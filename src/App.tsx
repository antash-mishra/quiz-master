import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import QuizContainer from './components/QuizContainer';
import QuizResults from './components/QuizResults';
import AdminLayout from './components/AdminLayout';
import { BookOpen } from 'lucide-react';
import { initializeDatabase } from './lib/db';

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
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col w-full max-w-full overflow-x-hidden">
        <header className="py-3 md:py-4 bg-white shadow-sm sticky top-0 z-10 w-full">
          <div className="container mx-auto px-3 md:px-4 w-full max-w-full">
            <div className="flex items-center gap-2 w-full max-w-full">
              <div className="bg-blue-600 text-white p-1.5 md:p-2 rounded-lg flex-shrink-0">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h1 className="text-lg md:text-2xl font-bold text-blue-600 truncate">QuizMaster</h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-8 w-full max-w-full overflow-x-hidden">
          <QuizProvider>
            <Routes>
              <Route path="/" element={<QuizContainer />} />
              <Route path="/quiz-results" element={<QuizResults />} />
              <Route path="/admin/*" element={<AdminLayout />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </QuizProvider>
        </main>
        
        <footer className="py-3 md:py-4 text-center text-gray-500 text-xs md:text-sm w-full">
          <p>© 2025 QuizMaster</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;