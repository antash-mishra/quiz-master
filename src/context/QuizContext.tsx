import React, { createContext, useContext, useReducer } from 'react';
import { Quiz, QuizState, QuizResult } from '../types';
import { saveStudentResponse } from '../lib/db';

interface QuizContextType {
  quiz: Quiz | null;
  quizState: QuizState;
  setQuiz: (quiz: Quiz) => void;
  answerQuestion: (questionId: string, answerId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  calculateResults: () => QuizResult;
  resetQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

type QuizAction =
  | { type: 'SET_QUIZ'; payload: Quiz }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answerId: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'RESET_QUIZ' };

interface QuizProviderProps {
  children: React.ReactNode;
}

const initialState: QuizState = {
  currentQuestionIndex: 0,
  answers: {},
  isCompleted: false,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_QUIZ':
      return initialState;
    case 'ANSWER_QUESTION':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answerId,
        },
      };
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };
    case 'PREVIOUS_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
      };
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        isCompleted: true,
      };
    case 'RESET_QUIZ':
      return initialState;
    default:
      return state;
  }
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [quiz, setActiveQuiz] = React.useState<Quiz | null>(null);
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const setQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    dispatch({ type: 'SET_QUIZ', payload: quiz });
  };

  const answerQuestion = async (questionId: string, answerId: string) => {
    if (!quiz) return;

    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = answerId === question.correctAnswerId;

    try {
      await saveStudentResponse({
        studentId: state.studentId!,
        quizId: quiz.id,
        questionId,
        selectedOptionId: answerId,
        isCorrect
      });

      dispatch({
        type: 'ANSWER_QUESTION',
        payload: { questionId, answerId },
      });
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;

    if (state.currentQuestionIndex < quiz.questions.length - 1) {
      dispatch({ type: 'NEXT_QUESTION' });
    } else {
      dispatch({ type: 'COMPLETE_QUIZ' });
    }
  };

  const previousQuestion = () => {
    dispatch({ type: 'PREVIOUS_QUESTION' });
  };

  const calculateResults = (): QuizResult => {
    if (!quiz) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
        questionResults: [],
      };
    }

    const questionResults = quiz.questions.map((question) => {
      const userAnswerId = state.answers[question.id] || '';
      const isCorrect = userAnswerId === question.correctAnswerId;

      return {
        questionId: question.id,
        isCorrect,
        userAnswerId,
        correctAnswerId: question.correctAnswerId,
      };
    });

    const correctAnswers = questionResults.filter((r) => r.isCorrect).length;
    const score = (correctAnswers / quiz.questions.length) * 100;

    return {
      totalQuestions: quiz.questions.length,
      correctAnswers,
      score,
      questionResults,
    };
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    dispatch({ type: 'RESET_QUIZ' });
  };

  return (
    <QuizContext.Provider
      value={{
        quiz,
        quizState: state,
        setQuiz,
        answerQuestion,
        nextQuestion,
        previousQuestion,
        calculateResults,
        resetQuiz,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};