import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Square, AlertCircle, CheckCircle, Loader2, Plus, Volume2, Key } from 'lucide-react';
import { Question } from '../types';
import { AI_PROVIDERS, AIProvider } from '../services/aiProviders';
import { useAIProcessing } from '../hooks/useAIProcessing';
import { QuestionEditor, QuestionDisplay, AIProviderSelector, ModernInput } from './shared';
import '../types/speech.d.ts';

interface SpeechQuizBuilderProps {
  onQuestionAdded: (question: Question) => void;
  isLoading?: boolean;
}

export default function SpeechQuizBuilder({ onQuestionAdded, isLoading }: SpeechQuizBuilderProps) {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<AIProvider['name']>('openai');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

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
          setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        };
      } else {
      setError('Speech recognition is not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [setError]);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setError('');
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
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
        </p>

        {/* API Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AIProviderSelector
            value={provider}
            onChange={setProvider}
          />
          
          <ModernInput
            type="password"
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Enter your ${provider} API key`}
            showPasswordToggle={true}
            icon={Key}
          />
        </div>

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
                    disabled={isRecording || isProcessing}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Start Recording</span>
                  </button>
                  
                  <button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    <Square className="h-5 w-5" />
                    <span>Stop Recording</span>
                  </button>
                </div>
                
                {isRecording && (
                  <p className="text-red-600 font-medium animate-pulse">
                    🔴 Recording... Speak your question clearly
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