import { Quiz } from '../types';

export const sampleQuiz: Quiz = {
  id: '1',
  title: 'General Knowledge Quiz',
  description: 'Test your knowledge with these general trivia questions.',
  questions: [
    {
      id: 'q1',
      text: 'What is the capital of France?',
      type: 'multiple-choice',
      options: [
        { id: 'a', text: 'London' },
        { id: 'b', text: 'Berlin' },
        { id: 'c', text: 'Paris' },
        { id: 'd', text: 'Rome' },
      ],
      correctAnswerId: 'c',
    },
    {
      id: 'q2',
      text: 'The Great Wall of China is visible from space.',
      type: 'true-false',
      options: [
        { id: 'a', text: 'True' },
        { id: 'b', text: 'False' },
      ],
      correctAnswerId: 'b',
    },
    {
      id: 'q3',
      text: 'Which planet is known as the Red Planet?',
      type: 'multiple-choice',
      options: [
        { id: 'a', text: 'Venus' },
        { id: 'b', text: 'Mars' },
        { id: 'c', text: 'Jupiter' },
        { id: 'd', text: 'Saturn' },
      ],
      correctAnswerId: 'b',
    },
    {
      id: 'q4',
      text: 'Water boils at 100 degrees Celsius at sea level.',
      type: 'true-false',
      options: [
        { id: 'a', text: 'True' },
        { id: 'b', text: 'False' },
      ],
      correctAnswerId: 'a',
    },
    {
      id: 'q5',
      text: 'Which of these is not a programming language?',
      type: 'multiple-choice',
      options: [
        { id: 'a', text: 'Python' },
        { id: 'b', text: 'Java' },
        { id: 'c', text: 'Banana' },
        { id: 'd', text: 'Ruby' },
      ],
      correctAnswerId: 'c',
    },
  ],
};