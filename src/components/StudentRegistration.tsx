import React, { useState } from 'react';
import { createStudent } from '../lib/db';

interface StudentRegistrationProps {
  onRegister: (id: string, name: string) => void;
}

const StudentRegistration: React.FC<StudentRegistrationProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      setIsLoading(true);
      const studentId = await createStudent(name);
      onRegister(studentId, name);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to register. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 w-full max-w-md">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">Welcome to QuizMaster</h2>
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Enter your name to begin</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              placeholder="Enter your name"
              disabled={isLoading}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 text-sm md:text-base"
          >
            {isLoading ? 'Registering...' : 'Start Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentRegistration;