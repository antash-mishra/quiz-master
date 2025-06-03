import { useState } from 'react';
import { Question } from '../types';
import { AIQuestionProcessor, AI_PROVIDERS, validateApiKey, AIProvider } from '../services/aiProviders';

export interface UseAIProcessingProps {
  apiKey: string;
  provider: AIProvider['name'];
}

export interface AIProcessingState {
  isProcessing: boolean;
  error: string;
  extractedQuestions: Question[];
}

export interface AIProcessingActions {
  processImages: (images: File[]) => Promise<Question[]>;
  processSpeech: (transcript: string) => Promise<Question | null>;
  setError: (error: string) => void;
  clearExtractedQuestions: () => void;
  setExtractedQuestions: (questions: Question[]) => void;
}

export type UseAIProcessingReturn = [AIProcessingState, AIProcessingActions];

export function useAIProcessing({ apiKey, provider }: UseAIProcessingProps): UseAIProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);

  // Initialize the AI processor
  const processor = new AIQuestionProcessor(apiKey, provider);

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const processImages = async (images: File[]): Promise<Question[]> => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Validate API key first
      const keyError = validateApiKey(provider, apiKey);
      if (keyError) {
        throw new Error(keyError);
      }

      if (images.length === 0) {
        throw new Error('Please upload at least one image');
      }

      // Process all images
      const allQuestions: Question[] = [];
      
      for (const image of images) {
        try {
          // Convert file to base64
          const imageData = await fileToBase64(image);
          const question = await processor.processImageToQuestion(imageData);
          if (question) {
            allQuestions.push(question);
          }
        } catch (err) {
          console.error(`Error processing image ${image.name}:`, err);
          // Continue with other images even if one fails
        }
      }

      if (allQuestions.length === 0) {
        throw new Error('No questions could be extracted from the uploaded images');
      }

      setExtractedQuestions(allQuestions);
      return allQuestions;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process images';
      setError(errorMessage);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  const processSpeech = async (transcript: string): Promise<Question | null> => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Validate API key first
      const keyError = validateApiKey(provider, apiKey);
      if (keyError) {
        throw new Error(keyError);
      }

      if (!transcript.trim()) {
        throw new Error('No speech transcript available to process');
      }

      // Get the raw JSON string from the AI
      const questionJson = await processor.processSpeechToQuestion(transcript);
      
      if (!questionJson) {
        throw new Error('Could not extract a valid question from the speech');
      }

      // Parse the JSON string to create a Question object
      try {
        const questionData = JSON.parse(questionJson);
        
        // Generate unique IDs for the question and options
        const questionId = crypto.randomUUID();
        let options: any[] = [];
        let correctAnswerId = '';
        
        if (questionData.type === 'multiple-choice' || questionData.type === 'true-false') {
          options = (questionData.options || []).map((opt: any) => {
            const optionId = crypto.randomUUID();
            return { id: optionId, text: opt.text || '' };
          });
          
          // Set correct answer ID if specified
          if (questionData.correctAnswerId !== undefined && options.length > 0) {
            // If correctAnswerId is an index, convert to the actual ID
            if (typeof questionData.correctAnswerId === 'number') {
              const index = Math.min(Math.max(0, questionData.correctAnswerId), options.length - 1);
              correctAnswerId = options[index].id;
            } else {
              // Default to first option if not specified correctly
              correctAnswerId = options[0].id;
            }
          }
        }
        
        const question: Question = {
          id: questionId,
          text: questionData.text || '',
          type: questionData.type || 'multiple-choice',
          options,
          correctAnswerId,
          sampleAnswer: questionData.sampleAnswer || ''
        };

        return question;
      } catch (parseErr) {
        throw new Error('Could not parse the AI response into a valid question');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process speech';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearExtractedQuestions = () => {
    setExtractedQuestions([]);
    setError('');
  };

  const setErrorMessage = (errorMessage: string) => {
    setError(errorMessage);
  };

  const state: AIProcessingState = {
    isProcessing,
    error,
    extractedQuestions
  };

  const actions: AIProcessingActions = {
    processImages,
    processSpeech,
    setError: setErrorMessage,
    clearExtractedQuestions,
    setExtractedQuestions
  };

  return [state, actions];
} 