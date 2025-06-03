import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, LineChart, LogOut, Menu, X } from 'lucide-react';
import QuizBuilder from './QuizBuilder';
import QuizResponses from './QuizResponses';

const ADMIN_PASSWORD = 'admin123'; // In a real app, this would be handled securely

const AdminLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Admin Login</h2>
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
    <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-between items-center mb-8">
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

      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold">{location.pathname.includes('create') ? 'Create' : 'Responses'}</h1>
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white p-3 rounded-lg shadow-lg mb-4 animate-fade-in">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => handleNavigation('/admin/create')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                location.pathname === '/admin/create'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Quiz</span>
            </button>
            <button
              onClick={() => handleNavigation('/admin/responses')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                location.pathname === '/admin/responses'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Responses</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 mt-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      <Routes>
        <Route path="/create" element={<QuizBuilder />} />
        <Route path="/responses" element={<QuizResponses />} />
        <Route path="*" element={<Navigate to="/admin/create" replace />} />
      </Routes>
    </div>
  );
};

export default AdminLayout;