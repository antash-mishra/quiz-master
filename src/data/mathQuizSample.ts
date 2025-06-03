import { Quiz } from '../types';

export const mathQuizSample: Quiz = {
  id: 'math-sample',
  title: 'Mathematics Quiz with $\\LaTeX$ Support',
  description: 'Test your math skills with equations like $E = mc^2$ and complex formulas!',
  questions: [
    {
      id: 'q1',
      text: 'What is the solution to the quadratic equation $ax^2 + bx + c = 0$?',
      type: 'multiple-choice',
      options: [
        { id: 'a', text: '$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$' },
        { id: 'b', text: '$x = \\frac{b \\pm \\sqrt{b^2 + 4ac}}{2a}$' },
        { id: 'c', text: '$x = \\frac{-b \\pm \\sqrt{b^2 + 4ac}}{a}$' },
        { id: 'd', text: '$x = \\frac{b \\pm \\sqrt{b^2 - 4ac}}{a}$' },
      ],
      correctAnswerId: 'a',
    },
    {
      id: 'q2',
      text: 'Einstein\'s mass-energy equivalence is correctly written as $E = mc^2$.',
      type: 'true-false',
      options: [
        { id: 'a', text: 'True' },
        { id: 'b', text: 'False' },
      ],
      correctAnswerId: 'a',
    },
    {
      id: 'q3',
      text: 'Calculate the derivative: $$\\frac{d}{dx}[x^3 + 2x^2 - 5x + 1] = ?$$',
      type: 'multiple-choice',
      options: [
        { id: 'a', text: '$3x^2 + 4x - 5$' },
        { id: 'b', text: '$3x^2 + 2x - 5$' },
        { id: 'c', text: '$x^3 + 4x - 5$' },
        { id: 'd', text: '$3x^3 + 4x^2 - 5x$' },
      ],
      correctAnswerId: 'a',
    },
    {
      id: 'q4',
      text: 'What is the integral: $$\\int x^2 dx = ?$$',
      type: 'multiple-choice',
      options: [
        { id: 'a', text: '$2x + C$' },
        { id: 'b', text: '$\\frac{x^3}{3} + C$' },
        { id: 'c', text: '$x^3 + C$' },
        { id: 'd', text: '$\\frac{x^2}{2} + C$' },
      ],
      correctAnswerId: 'b',
    },
    {
      id: 'q5',
      text: 'Prove that the sum of angles in a triangle is $180°$ or $\\pi$ radians.',
      type: 'subjective',
      options: [],
      correctAnswerId: '',
      sampleAnswer: 'Using the parallel postulate, we can show that when a transversal crosses two parallel lines, corresponding angles are equal. By extending one side of a triangle and drawing a line parallel to another side, we can demonstrate that $\\alpha + \\beta + \\gamma = \\pi$ radians.',
    },
  ],
}; 