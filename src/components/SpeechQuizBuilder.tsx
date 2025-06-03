import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, AlertCircle, CheckCircle, Loader2, Plus, Volume2, Upload, FileAudio } from 'lucide-react';
import { Question } from '../types';
import { AI_PROVIDERS, AIProvider } from '../services/aiProviders';
import { useAIProcessing } from '../hooks/useAIProcessing';
import { QuestionEditor } from './shared';
import { GroqTranscriptionService, AudioRecorder } from '../services/groqTranscription';

interface SpeechQuizBuilderProps {
  onQuestionAdded: (question: Question) => void;
  isLoading?: boolean;
}

export default function SpeechQuizBuilder({ onQuestionAdded, isLoading }: SpeechQuizBuilderProps) {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState('');
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const transcriptionServiceRef = useRef<GroqTranscriptionService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get API keys from environment
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

  // Use OpenAI for question processing
  const [aiState, aiActions] = useAIProcessing({ 
    apiKey: openaiApiKey, 
    provider: 'openai' as AIProvider['name'] 
  });
  const { isProcessing } = aiState;
  const { processSpeech } = aiActions;

  // Initialize services
  useEffect(() => {
    if (groqApiKey) {
      transcriptionServiceRef.current = new GroqTranscriptionService(groqApiKey);
    }
    audioRecorderRef.current = new AudioRecorder();

    return () => {
      // Cleanup on unmount
      if (audioRecorderRef.current) {
        audioRecorderRef.current.destroy();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [groqApiKey]);

  const startRecording = async () => {
    if (!audioRecorderRef.current || !transcriptionServiceRef.current) {
      setError('Recording services not available. Please check your Groq API key.');
      return;
    }

    if (!groqApiKey.trim()) {
      setError('Groq API key is required for transcription. Please add VITE_GROQ_API_KEY to your environment variables.');
      return;
    }

    try {
      setError('');
      setIsRecording(true);
      setRecordingDuration(0);
      
      await audioRecorderRef.current.startRecording();
      
      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setError(`Failed to start recording: ${error.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current || !transcriptionServiceRef.current) {
      setError('Recording services not available');
      return;
    }

    try {
      setIsRecording(false);
      
      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setIsTranscribing(true);
      setError('');

      // Stop recording and get audio blob
      const audioBlob = await audioRecorderRef.current.stopRecording();
      
      // Transcribe audio using Groq Whisper
      const transcribedText = await transcriptionServiceRef.current.transcribeAudio(audioBlob);
      
      if (transcribedText.trim()) {
        setTranscript(transcribedText.trim());
      } else {
        setError('No speech detected in the recording. Please try again.');
      }
      
    } catch (error: any) {
      console.error('Error stopping recording or transcribing:', error);
      setError(`Transcription failed: ${error.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !transcriptionServiceRef.current) {
      return;
    }

    // Check file size (max 25MB for Groq)
    if (file.size > 25 * 1024 * 1024) {
      setError('File too large. Maximum size is 25MB.');
      return;
    }

    // Check file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i)) {
      setError('Unsupported file type. Please use MP3, WAV, M4A, WebM, or OGG files.');
      return;
    }

    try {
      setIsTranscribing(true);
      setError('');
      
      const transcribedText = await transcriptionServiceRef.current.transcribeAudio(file);
      
      if (transcribedText.trim()) {
        setTranscript(transcribedText.trim());
      } else {
        setError('No speech detected in the uploaded file.');
      }
      
    } catch (error: any) {
      console.error('Error transcribing uploaded file:', error);
      setError(`Transcription failed: ${error.message}`);
    } finally {
      setIsTranscribing(false);
    }

    // Reset file input
    event.target.value = '';
  };

  const clearTranscript = () => {
    setTranscript('');
    setCurrentQuestion(null);
    setError('');
    setRecordingDuration(0);
  };

  const handleProcessSpeech = async () => {
    if (!transcript.trim()) {
      setError('Please record or upload audio first');
      return;
    }

    if (!openaiApiKey.trim()) {
      setError('OpenAI API key is required for question processing.');
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 sm:p-8 rounded-2xl border border-purple-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-purple-500 rounded-xl">
            <Volume2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Convert Speech to Questions
            </h3>
            <p className="text-purple-700 mt-1 text-sm sm:text-base">
              Record audio or upload files and let AI create structured questions
            </p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-8 text-base sm:text-lg">
          Use high-quality audio recording or upload audio files for accurate transcription. 
          Powered by Groq's Whisper for fast and accurate speech-to-text conversion.
        </p>

        {/* Recording Controls */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl border-2 border-purple-200 p-4 sm:p-8">
            <div className="text-center mb-6">
              <div className={`p-4 sm:p-6 rounded-full w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200' 
                  : 'bg-purple-100 hover:bg-purple-200'
              }`}>
                {isRecording ? (
                  <MicOff className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                ) : (
                  <Mic className="h-12 w-12 sm:h-16 sm:w-16 text-purple-600" />
                )}
              </div>
              
              {isRecording && (
                <div className="mb-4">
                  <p className="text-red-600 font-medium text-lg">🔴 Recording...</p>
                  <p className="text-gray-600 text-sm">Duration: {formatDuration(recordingDuration)}</p>
                </div>
              )}

              {isTranscribing && (
                <div className="mb-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <p className="text-blue-600 font-medium">Transcribing audio...</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Mobile-friendly button layout */}
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={startRecording}
                    disabled={isRecording || isTranscribing || isProcessing}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Start Recording</span>
                  </button>
                  
                  <button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <Square className="h-5 w-5" />
                    <span>Stop & Transcribe</span>
                  </button>

                  <button
                    onClick={clearTranscript}
                    disabled={isRecording || isTranscribing}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <span>Clear</span>
                  </button>
                </div>

                {/* File Upload */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-600 text-sm mb-3">Or upload an audio file:</p>
                  <label className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload Audio File</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      disabled={isRecording || isTranscribing || isProcessing}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2 text-center sm:text-left">
                    Supports MP3, WAV, M4A, WebM, OGG (max 25MB)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Transcript Display */}
            {transcript && (
              <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <FileAudio className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Transcript:</h4>
                </div>
                <p className="text-gray-700 italic break-words">"{transcript}"</p>
              </div>
            )}
          </div>
        </div>
          
        {/* Process Button */}
        <button
          onClick={handleProcessSpeech}
          disabled={isProcessing || !transcript.trim() || !openaiApiKey.trim()}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
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
            <p className="text-red-700 font-medium break-words">{error}</p>
          </div>
        )}

        {/* API Key Warning */}
        {!groqApiKey.trim() && (
          <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-700 font-medium">Groq API Key Required</p>
              <p className="text-yellow-600 text-sm mt-1 break-words">
                Please add your Groq API key to the environment variables as VITE_GROQ_API_KEY to use speech transcription.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Generated Question */}
      {currentQuestion && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-8 rounded-2xl border border-green-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Generated Question
              </h3>
              <p className="text-green-700 mt-1 text-sm sm:text-base">
                Review and edit the question before adding to your quiz
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-green-200 shadow-sm">
            <QuestionEditor
              question={currentQuestion}
              onChange={setCurrentQuestion}
              error={error}
              showPreview={true}
            />
          </div>
          
          <div className="mt-6 sm:mt-8 pt-6 border-t border-green-200">
            <button
              onClick={handleAddQuestion}
              disabled={isLoading || !currentQuestion}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
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