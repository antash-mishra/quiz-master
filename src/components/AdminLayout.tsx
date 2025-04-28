import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, LineChart, LogOut } from 'lucide-react';
import QuizBuilder from './QuizBuilder';
import QuizResponses from './QuizResponses';

const ADMIN_PASSWORD = 'admin123'; // In a real app, this would be handled securely

const AdminLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      navigate('/admin/create');
    } else {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    navigate('/admin');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <nav className="flex gap-4">
          <button
            onClick={() => navigate('/admin/create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === '/admin/create'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Quiz</span>
          </button>
          <button
            onClick={() => navigate('/admin/responses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === '/admin/responses'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LineChart className="w-5 h-5" />
            <span>View Responses</span>
          </button>
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      <Routes>
        <Route path="/create" element={<QuizBuilder />} />
        <Route path="/responses" element={<QuizResponses />} />
        <Route path="*" element={<Navigate to="/admin/create" replace />} />
      </Routes>
    </div>
  );
};

export default AdminLayout;