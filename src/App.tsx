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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
        <header className="py-4 bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-blue-600">QuizMaster</h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <QuizProvider>
            <Routes>
              <Route path="/" element={<QuizContainer />} />
              <Route path="/quiz-results" element={<QuizResults />} />
              <Route path="/admin/*" element={<AdminLayout />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </QuizProvider>
        </main>
        
        <footer className="py-4 text-center text-gray-500 text-sm">
          <p>© 2025 QuizMaster. All rights reserved.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;