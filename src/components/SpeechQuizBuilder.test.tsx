import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpeechQuizBuilder } from './SpeechQuizBuilder';
import { createQuizFromJson } from '../services/AIService';
import { QuizContext } from '../contexts/QuizContext';

// Mock AIService 
jest.mock('../services/AIService', () => ({
  createQuizFromJson: jest.fn(),
  processTranscriptToJson: jest.fn().mockResolvedValue({
    success: true,
    data: JSON.stringify({
      quizTitle: "Test Quiz",
      questions: [
        {
          question: "What is React?",
          options: ["A JS library", "A CSS framework", "A database", "A server"],
          answer: 0
        }
      ]
    })
  })
}));

// Mock quiz context
const mockSetQuiz = jest.fn();
const mockQuizContext = {
  quiz: null,
  setQuiz: mockSetQuiz,
  isLoading: false,
  setIsLoading: jest.fn(),
  error: null,
  setError: jest.fn()
};

describe('SpeechQuizBuilder Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders speech recording interface', () => {
    render(
      <QuizContext.Provider value={mockQuizContext}>
        <SpeechQuizBuilder />
      </QuizContext.Provider>
    );
    
    expect(screen.getByText(/start recording/i)).toBeInTheDocument();
  });

  test('processes transcript and displays JSON for editing', async () => {
    render(
      <QuizContext.Provider value={mockQuizContext}>
        <SpeechQuizBuilder />
      </QuizContext.Provider>
    );

    // Simulate a completed transcription
    const mockTranscription = "Create a quiz about React with 5 questions";
    const transcriptionInput = screen.getByLabelText(/edit transcription/i);
    fireEvent.change(transcriptionInput, { target: { value: mockTranscription } });
    
    // Process transcription
    const processButton = screen.getByRole('button', { name: /process transcription/i });
    fireEvent.click(processButton);
    
    // Verify JSON editor is displayed with the processed JSON
    await waitFor(() => {
      expect(screen.getByLabelText(/edit json/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/edit json/i)).toHaveValue(expect.stringContaining("Test Quiz"));
    });
  });

  test('validates JSON before creating quiz', async () => {
    render(
      <QuizContext.Provider value={mockQuizContext}>
        <SpeechQuizBuilder />
      </QuizContext.Provider>
    );
    
    // Simulate having JSON in the editor
    const jsonEditor = screen.getByLabelText(/edit json/i);
    fireEvent.change(jsonEditor, { target: { value: 'invalid json' } });
    
    // Try to create quiz
    const createButton = screen.getByRole('button', { name: /create quiz/i });
    fireEvent.click(createButton);
    
    // Should show error for invalid JSON
    await waitFor(() => {
      expect(screen.getByText(/invalid json format/i)).toBeInTheDocument();
    });
    
    // createQuizFromJson should not be called with invalid JSON
    expect(createQuizFromJson).not.toHaveBeenCalled();
  });

  test('creates quiz from valid JSON', async () => {
    render(
      <QuizContext.Provider value={mockQuizContext}>
        <SpeechQuizBuilder />
      </QuizContext.Provider>
    );
    
    // Simulate having valid JSON in the editor
    const validJson = JSON.stringify({
      quizTitle: "React Basics",
      questions: [{ 
        question: "What is React?", 
        options: ["Library", "Framework", "Language", "Database"], 
        answer: 0 
      }]
    });
    
    const jsonEditor = screen.getByLabelText(/edit json/i);
    fireEvent.change(jsonEditor, { target: { value: validJson } });
    
    // Create quiz
    const createButton = screen.getByRole('button', { name: /create quiz/i });
    fireEvent.click(createButton);
    
    // Verify createQuizFromJson was called with the right JSON
    await waitFor(() => {
      expect(createQuizFromJson).toHaveBeenCalledWith(JSON.parse(validJson));
    });
  });

  test('formats JSON when requested', async () => {
    render(
      <QuizContext.Provider value={mockQuizContext}>
        <SpeechQuizBuilder />
      </QuizContext.Provider>
    );
    
    // Simulate having unformatted JSON in the editor
    const unformattedJson = '{"quizTitle":"React Basics","questions":[{"question":"What is React?","options":["Library","Framework","Language","Database"],"answer":0}]}';
    const jsonEditor = screen.getByLabelText(/edit json/i);
    fireEvent.change(jsonEditor, { target: { value: unformattedJson } });
    
    // Format JSON
    const formatButton = screen.getByRole('button', { name: /format json/i });
    fireEvent.click(formatButton);
    
    // Verify JSON was formatted
    await waitFor(() => {
      expect(jsonEditor.value).not.toBe(unformattedJson);
      expect(jsonEditor.value.includes('\n')).toBe(true);
    });
  });

  test('shows example JSON when button is clicked', () => {
    render(
      <QuizContext.Provider value={mockQuizContext}>
        <SpeechQuizBuilder />
      </QuizContext.Provider>
    );
    
    // Click on show example button
    const exampleButton = screen.getByRole('button', { name: /show example/i });
    fireEvent.click(exampleButton);
    
    // Verify example JSON is displayed
    expect(screen.getByLabelText(/edit json/i).value).toContain('quizTitle');
    expect(screen.getByLabelText(/edit json/i).value).toContain('questions');
  });
}); 