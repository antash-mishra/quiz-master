import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Square, AlertCircle, CheckCircle, Loader2, Plus, Volume2, RotateCcw } from 'lucide-react';
import { Question } from '../types';
import { AI_PROVIDERS, AIProvider } from '../services/aiProviders';
import { useAIProcessing } from '../hooks/useAIProcessing';
import { QuestionEditor, QuestionDisplay } from './shared';
import '../types/speech.d.ts';

interface SpeechQuizBuilderProps {
  onQuestionAdded: (question: Question) => void;
  isLoading?: boolean;
}

export default function SpeechQuizBuilder({ onQuestionAdded, isLoading }: SpeechQuizBuilderProps) {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Use Gemini by default with API key from environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const provider: AIProvider['name'] = 'gemini';

  const [aiState, aiActions] = useAIProcessing({ apiKey, provider });
  const { isProcessing, error } = aiState;
  const { processSpeech, setError } = aiActions;

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Mobile-specific configuration
      if (isMobile) {
        // On mobile, set these properties to prevent auto-stopping
        recognition.continuous = false;
        recognition.interimResults = true; // Less processing on mobile
        // Some mobile browsers respect these timeout settings
        if ('grammars' in recognition) {
          recognition.grammars = new (window as any).SpeechGrammarList();
        }
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different types of errors with appropriate messages and actions
        switch (event.error) {
          case 'aborted':
            // Don't show aborted errors as they're usually intentional
            break;
          case 'network':
            if (retryCount < 3 && isRecording) {
              setIsRetrying(true);
              setError(`Network error (retry ${retryCount + 1}/3): Attempting to reconnect...`);
              setRetryCount(prev => prev + 1);
              
              // Retry after 2 seconds
              retryTimeoutRef.current = setTimeout(() => {
                if (isRecording && recognitionRef.current) {
                  try {
                    setIsRetrying(false);
                    recognitionRef.current.start();
                  } catch (error) {
                    console.error('Error retrying speech recognition:', error);
                    setIsRetrying(false);
                    setError('Failed to restart speech recognition after network error.');
                    setIsRecording(false);
                    setRecognitionActive(false);
                  }
                }
              }, 2000);
              return; // Don't stop recording, we're retrying
            } else {
              setError('Network error: Please check your internet connection and try again. Speech recognition requires an internet connection.');
            }
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone permissions and refresh the page.');
            break;
          case 'no-speech':
            setError('No speech detected. Please speak clearly and try again.');
            // Don't stop recording for no-speech errors, just continue listening
            return;
          case 'audio-capture':
            setError('Microphone not found or not working. Please check your microphone.');
            break;
          case 'service-not-allowed':
            setError('Speech recognition service not available. Please try again later.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}. Please try again.`);
        }
        
        setIsRecording(false);
        setRecognitionActive(false);
        setIsRetrying(false);
      };

      recognition.onend = () => {
        // Only stop if the user intentionally stopped or there was an error
        // If recognition ends unexpectedly while recording, restart it
        if (isRecording && recognitionActive) {
          try {
            // Use shorter timeout for mobile to restart faster
            const restartDelay = isMobile ? 50 : 100;
            setTimeout(() => {
              if (isRecording && recognitionRef.current) {
                console.log('Auto-restarting speech recognition...', isMobile ? '(mobile)' : '(desktop)');
                recognitionRef.current.start();
              }
            }, restartDelay);
          } catch (error) {
            console.error('Error restarting speech recognition:', error);
            setIsRecording(false);
            setRecognitionActive(false);
          }
        } else {
          setIsRecording(false);
          setRecognitionActive(false);
        }
      };

      recognition.onstart = () => {
        setRecognitionActive(true);
      };
    } else {
      setError('Speech recognition is not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          // Stop gracefully instead of aborting
          if (recognitionActive) {
            recognitionRef.current.stop();
          }
          setRecognitionActive(false);
        } catch (error) {
          // Ignore cleanup errors
          console.log('Speech recognition cleanup:', error);
        }
      }
      
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [setError, recognitionActive]);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording && !recognitionActive && !isRetrying) {
      setError('');
      setRetryCount(0); // Reset retry count
      
      // Show mobile-specific message
      if (isMobile) {
        console.log('Starting speech recognition on mobile device');
      }
      
      try {
        setIsRecording(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setError(`Failed to start speech recognition${isMobile ? ' (mobile)' : ''}`);
        setIsRecording(false);
        setRecognitionActive(false);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && (isRecording || recognitionActive)) {
      // First set recording to false to prevent restart in onend handler
      setIsRecording(false);
      setIsRetrying(false);
      
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      
      // Ensure state is cleared
      setRecognitionActive(false);
      setRetryCount(0);
    }
  };

  const restartRecording = () => {
    // Stop current recording
    stopRecording();
    
    // Clear transcript and errors
    setTranscript('');
    setError('');
    setCurrentQuestion(null);
    
    // Start new recording after a brief delay
    setTimeout(() => {
      startRecording();
    }, 200);
  };

  const clearTranscript = () => {
    setTranscript('');
    setCurrentQuestion(null);
    setError('');
  };

  const playTranscript = () => {
    if (!transcript.trim()) {
      setError('No transcript to play');
      return;
    }

    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(transcript);
    synthRef.current = utterance;
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = () => {
      setError('Error playing speech');
      setIsPlaying(false);
    };

    setIsPlaying(true);
    speechSynthesis.speak(utterance);
  };

  const handleProcessSpeech = async () => {
    if (!transcript.trim()) {
      setError('Please record some speech first');
      return;
    }

    const question = await processSpeech(transcript);
    if (question) {
      setCurrentQuestion(question);
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion) {
      setError('No question available to add');
      return;
    }

    if (!validateQuestion(currentQuestion)) {
      return;
    }

    onQuestionAdded(currentQuestion);
    clearTranscript();
  };

  const validateQuestion = (question: Question): boolean => {
    setError('');
    
    if (!question.text.trim()) {
      setError('Question text is required');
      return false;
    }

    if (question.type !== 'subjective') {
      if (!question.correctAnswerId) {
        setError('Please select a correct answer');
        return false;
      }

      if (question.options.some(opt => !opt.text.trim())) {
        setError('All options must have text');
        return false;
      }
    }

    return true;
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-2xl border border-purple-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-purple-500 rounded-xl">
            <Volume2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Convert Speech to Questions
            </h3>
            <p className="text-purple-700 mt-1">
              Speak your questions and let AI structure them
            </p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-8 text-lg">
          Speak your quiz questions naturally and AI will convert them into structured multiple-choice format. 
          You can review and edit the generated questions before adding them to your quiz.
          {isMobile && (
            <span className="block mt-2 text-blue-600 font-medium">
              📱 Mobile tip: Keep speaking continuously for best results. The app will automatically restart if needed.
              <br />
              💡 Use the "Restart" button to clear and start fresh anytime.
            </span>
          )}
        </p>

        {/* Speech Recording */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Record Your Question
          </label>
          
          <div className="bg-white rounded-2xl border-2 border-purple-200 p-8">
            <div className="text-center mb-6">
              <div className={`p-6 rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200' 
                  : 'bg-purple-100 hover:bg-purple-200'
              }`}>
                {isRecording ? (
                  <MicOff className="h-16 w-16 text-white" />
                ) : (
                  <Mic className={`h-16 w-16 ${isRecording ? 'text-white' : 'text-purple-600'}`} />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={startRecording}
                    disabled={isRecording || isProcessing || isRetrying}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Start Recording</span>
                  </button>
                  
                  <button
                    onClick={restartRecording}
                    disabled={isProcessing || isRetrying}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>Restart</span>
                  </button>
                  
                <button
                    onClick={stopRecording}
                    disabled={!isRecording && !isRetrying}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <Square className="h-5 w-5" />
                    <span>Stop Recording</span>
                </button>
                </div>
                
                {(isRecording || isRetrying) && (
                  <p className={`font-medium animate-pulse ${isRetrying ? 'text-yellow-600' : 'text-red-600'}`}>
                    {isRetrying ? '🔄 Reconnecting... Please wait' : '🔴 Recording... Speak your question clearly'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Transcript Display */}
            {transcript && (
              <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-2">Transcript:</h4>
                <p className="text-gray-700 italic">"{transcript}"</p>
              </div>
            )}
          </div>
            </div>
          
        {/* Process Button */}
            <button
          onClick={handleProcessSpeech}
          disabled={isProcessing || !transcript.trim() || !apiKey.trim()}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {isProcessing ? (
                <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Processing Speech...</span>
            </>
          ) : (
            <>
              <Plus className="h-6 w-6" />
              <span>Convert Speech to Question</span>
            </>
          )}
        </button>
        
        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
        </div>
      
      {/* Generated Question */}
      {currentQuestion && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Generated Question
              </h3>
              <p className="text-green-700 mt-1">
                Review and edit the question before adding to your quiz
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm">
            <QuestionEditor
              question={currentQuestion}
              onChange={setCurrentQuestion}
              error={error}
            />
            </div>
          
          <div className="mt-8 pt-6 border-t border-green-200">
            <button
              onClick={handleAddQuestion}
              disabled={isLoading || !currentQuestion}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Adding Question...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6" />
                  <span>Add Question to Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 