export type QuestionType = 'multiple-choice' | 'true-false' | 'subjective';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: Option[];
  correctAnswerId: string;
  sampleAnswer?: string; // For subjective questions
  image?: string; // Base64 encoded image data for question diagrams/pictures
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  googleId?: string;
  profilePicture?: string;
  createdAt?: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  isCompleted: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  questionResults: {
    questionId: string;
    isCorrect: boolean;
    userAnswerId: string;
    correctAnswerId: string;
  }[];
}