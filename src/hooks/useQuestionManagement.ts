import { useState, useEffect, useCallback } from 'react';
import { Question, QuestionType } from '../types';
import { addQuestionToQuiz, getQuestions } from '../lib/db';

export interface UseQuestionManagementProps {
  quizId: string;
}

export interface QuestionManagementState {
  questions: Question[];
  editingQuestionIndex: number | null;
  editingQuestion: Question | null;
  isLoading: boolean;
  error: string;
  successMessage: string;
}

export interface QuestionManagementActions {
  // Question operations
  addQuestion: (question: Question, showSuccess?: boolean) => Promise<boolean>;
  removeQuestion: (index: number) => void;
  updateQuestion: (index: number, question: Question) => void;
  
  // Editing operations
  startEditingQuestion: (index: number) => void;
  cancelEditingQuestion: () => void;
  saveEditedQuestion: () => boolean;
  
  // Form helpers
  validateQuestion: (question: Question) => boolean;
  createEmptyQuestion: () => Question;
  
  // Database operations
  loadExistingQuestions: () => Promise<void>;
  
  // State setters
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
  setQuestions: (questions: Question[]) => void;
}

export type UseQuestionManagementReturn = [QuestionManagementState, QuestionManagementActions];

export function useQuestionManagement({ quizId }: UseQuestionManagementProps): UseQuestionManagementReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Type mapping utilities
  const mapQuestionTypeFromDB = (dbType: string): string => {
    switch (dbType) {
      case 'multiple_choice':
        return 'multiple-choice';
      case 'true_false':
        return 'true-false';
      case 'text':
        return 'subjective';
      default:
        return dbType;
    }
  };

  const mapQuestionTypeForDB = (type: string): string => {
    switch (type) {
      case 'multiple-choice':
        return 'multiple_choice';
      case 'true-false':
        return 'true_false';
      case 'subjective':
        return 'text';
      default:
        return type;
    }
  };

  // Load existing questions from database
  const loadExistingQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const existingQuestions = await getQuestions(quizId);
      // Map database types back to frontend types
      const mappedQuestions = existingQuestions.map(q => ({
        ...q,
        type: mapQuestionTypeFromDB(q.type) as QuestionType
      }));
      setQuestions(mappedQuestions);
    } catch (err) {
      console.error('Failed to load existing questions:', err);
      setError('Failed to load existing questions');
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  // Load questions on mount
  useEffect(() => {
    loadExistingQuestions();
  }, [loadExistingQuestions]);

  // Question validation
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

  // Create empty question
  const createEmptyQuestion = (): Question => ({
    id: crypto.randomUUID(),
    text: '',
    type: 'multiple-choice',
    options: [
      { id: crypto.randomUUID(), text: '' },
      { id: crypto.randomUUID(), text: '' },
    ],
    correctAnswerId: '',
  });

  // Add question to state and database
  const addQuestion = async (question: Question, showSuccess: boolean = true): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError('');
      
      // Create a modified version of the question with DB-compatible type
      const dbQuestion = {
        ...question,
        type: mapQuestionTypeForDB(question.type)
      };
      
      // Add question to database
      await addQuestionToQuiz(quizId, dbQuestion);
      
      // Add to local state
      setQuestions(prevQuestions => [...prevQuestions, question]);
      
      if (showSuccess) {
        setSuccessMessage('Question added successfully');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to add question:', err);
      setError('Failed to add question. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove question
  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    
    // If we're editing the question being removed, cancel editing
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      setEditingQuestion(null);
    }
    // If we're editing a question after the removed one, adjust the index
    else if (editingQuestionIndex !== null && editingQuestionIndex > index) {
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  };

  // Update question at specific index
  const updateQuestion = (index: number, question: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = question;
    setQuestions(newQuestions);
  };

  // Start editing question
  const startEditingQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setEditingQuestion({ ...questions[index] });
    setError('');
  };

  // Cancel editing
  const cancelEditingQuestion = () => {
    setEditingQuestionIndex(null);
    setEditingQuestion(null);
    setError('');
  };

  // Save edited question
  const saveEditedQuestion = (): boolean => {
    if (editingQuestionIndex !== null && editingQuestion) {
      if (!validateQuestion(editingQuestion)) {
        return false;
      }
      
      updateQuestion(editingQuestionIndex, editingQuestion);
      setEditingQuestionIndex(null);
      setEditingQuestion(null);
      setError('');
      return true;
    }
    return false;
  };

  // Custom setters for controlled updates
  const setErrorWithClear = (errorMessage: string) => {
    setError(errorMessage);
  };

  const setSuccessWithClear = (message: string) => {
    setSuccessMessage(message);
    // Auto-clear after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const state: QuestionManagementState = {
    questions,
    editingQuestionIndex,
    editingQuestion,
    isLoading,
    error,
    successMessage
  };

  const actions: QuestionManagementActions = {
    addQuestion,
    removeQuestion,
    updateQuestion,
    startEditingQuestion,
    cancelEditingQuestion,
    saveEditedQuestion,
    validateQuestion,
    createEmptyQuestion,
    loadExistingQuestions,
    setError: setErrorWithClear,
    setSuccessMessage: setSuccessWithClear,
    setQuestions
  };

  return [state, actions];
} 