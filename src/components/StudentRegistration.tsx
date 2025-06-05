import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { createStudent, findStudentByGoogleId, findStudentByEmail } from '../lib/db';

interface StudentRegistrationProps {
  onRegister: (id: string, name: string) => void;
}

interface GoogleUser {
  sub: string; // Google ID
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
}

const StudentRegistration: React.FC<StudentRegistrationProps> = ({ onRegister }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError('');

        // Fetch user info from Google using the access token
        const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
        const googleUser = await userInfoResponse.json();

        // Check if user already exists by Google ID
        let student = await findStudentByGoogleId(googleUser.sub);
        
        if (!student) {
          // Check if user exists by email
          student = await findStudentByEmail(googleUser.email);
          
          if (!student) {
            // Create new student
            const studentId = await createStudent({
              name: googleUser.name,
              email: googleUser.email,
              googleId: googleUser.sub,
              profilePicture: googleUser.picture
            });
            onRegister(studentId, googleUser.name);
          } else {
            // User exists with email but no Google ID - sign them in
            onRegister(student.id, student.name);
          }
        } else {
          // Existing user, sign them in
          onRegister(student.id, student.name);
        }
      } catch (err) {
        console.error('Google Sign-In error:', err);
        setError('Failed to sign in with Google. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google Sign-In was cancelled or failed. Please try again.');
      setIsLoading(false);
    },
  });

  return (
    <div className="flex items-center justify-center flex-1 w-full py-4 md:py-8">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 w-full max-w-md mx-auto">
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Welcome to QuizMaster</h2>
          <p className="text-sm md:text-base text-gray-600">Sign in with Google to begin taking quizzes</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Google Sign-In Section */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-6">Use your Google account to get started</p>
          
          {isLoading ? (
            <div className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl text-sm md:text-base flex items-center justify-center min-h-[56px] shadow-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Signing in...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Custom Google Button */}
              <div className="relative group">
                {/* Custom styled button */}
                <button
                  onClick={() => googleLogin()}
                  className="relative w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-2xl border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3 group-hover:shadow-blue-200/50"
                  disabled={isLoading}
                  style={{
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Google Logo SVG */}
                  <svg 
                    className="w-6 h-6" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      fill="#4285F4" 
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path 
                      fill="#34A853" 
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path 
                      fill="#FBBC05" 
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path 
                      fill="#EA4335" 
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  
                  <span className="text-lg font-semibold">Continue with Google</span>
                </button>
              </div>
              
              {/* Security notice */}
              <div className="text-center">
                <p className="text-xs text-gray-400">✨ Secure authentication powered by Google</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our terms of service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;