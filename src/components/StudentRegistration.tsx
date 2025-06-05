import React, { useState, useEffect, useRef } from 'react';
import { createStudent, findStudentByGoogleId, findStudentByEmail } from '../lib/db';
import { googleAuthService, GoogleUser } from '../services/googleAuth';
import { Student } from '../types';

interface StudentRegistrationProps {
  onRegister: (id: string, name: string) => void;
}

const StudentRegistration: React.FC<StudentRegistrationProps> = ({ onRegister }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(true);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeGoogleSignIn();
    
    // Cleanup function to ensure proper reinitialization
    return () => {
      setIsGoogleLoading(true);
      setError('');
    };
  }, []);

  const initializeGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');
      
      console.log('🔄 Initializing Google Sign-In...');
      console.log('📍 Current URL:', window.location.href);
      console.log('🔑 Google Client ID available:', !!import.meta.env.VITE_GOOGLE_CLIENT_ID);
      
      // Force reinitialization by resetting the service state if needed
      await googleAuthService.initialize();
      
      if (googleButtonRef.current) {
        // Clear any existing content
        googleButtonRef.current.innerHTML = '';
        
        console.log('🔘 Rendering Google Sign-In button...');
        googleAuthService.renderSignInButton(
          googleButtonRef.current,
          handleGoogleSignIn,
          handleGoogleError
        );
      } else {
        console.error('❌ Google button container ref is null');
        setError('Failed to initialize sign-in button container.');
      }
      setIsGoogleLoading(false);
    } catch (error) {
      console.error('❌ Failed to initialize Google Sign-In:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load Google Sign-In: ${errorMessage}. Please check the console for details.`);
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async (googleUser: GoogleUser) => {
    try {
      setIsLoading(true);
      setError('');

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
          // User exists with email but no Google ID - update with Google ID
          // Note: You might want to add an update function for this case
          onRegister(student.id, student.name);
        }
      } else {
        // Existing user, sign them in
        onRegister(student.id, student.name);
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    console.error('❌ Google Sign-In error:', error);
    setError(`Google Sign-In failed: ${error}. Please try refreshing the page.`);
  };

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
          <p className="text-sm text-gray-600 mb-4">Use your Google account to get started</p>
          
          {isGoogleLoading ? (
            <div className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-medium rounded-lg text-sm md:text-base flex items-center justify-center min-h-[44px]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              Loading Google Sign-In...
            </div>
          ) : (
            <div ref={googleButtonRef} className="w-full min-h-[44px]"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;