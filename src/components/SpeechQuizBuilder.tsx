import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Question, Option } from '../types';

interface SpeechQuizBuilderProps {
  onQuizData: (quizData: Quiz) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

const SpeechQuizBuilder: React.FC<SpeechQuizBuilderProps> = ({ 
  onQuizData, 
  isListening,
  setIsListening
}) => {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai');
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - TypeScript doesn't know about webkitSpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          if (event.results[current].isFinal) {
            setTranscript((prev) => prev + ' ' + event.results[current][0].transcript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };
      } else {
        setError('Speech recognition is not supported in this browser.');
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [setIsListening]);

  // Control listening state
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const processTranscriptWithAI = async () => {
    if (!transcript.trim()) {
      setError('Please speak to provide quiz content first.');
      return;
    }

    if (!apiKey.trim()) {
      setError(`Please enter your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key.`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const prompt = `
        Convert the following spoken description into a structured quiz in JSON format.
        
        The JSON should have this structure:
        {
          "title": "Quiz title",
          "description": "Quiz description",
          "questions": [
            {
              "text": "Question text",
              "type": "multiple-choice" | "true-false" | "subjective",
              "options": [
                { "text": "Option text" },
                { "text": "Option text" }
              ],
              "correctAnswerId": "ID of correct option (index for simplicity)"
            }
          ]
        }
        
        For true-false questions, provide exactly two options: "True" and "False".
        For subjective questions, include a "sampleAnswer" field but no options.
        
        Spoken description: ${transcript}
      `;

      let response;
      let quizString = '';
      
      if (provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to process with OpenAI');
        }
        
        quizString = data.choices[0].message.content;
        
      } else { // anthropic
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to process with Anthropic');
        }
        
        quizString = data.content[0].text;
      }
      
      // Extract JSON from the response (it might be wrapped in ```json or other markdown)
      const jsonMatch = quizString.match(/```(?:json)?([\s\S]*?)```/) || [null, quizString];
      const jsonStr = jsonMatch[1].trim();
      
      // Try to parse to validate it's proper JSON
      JSON.parse(jsonStr);
      
      // Set the JSON for editing
      setJsonOutput(jsonStr);
      setShowJsonEditor(true);

    } catch (err: any) {
      console.error('Error processing with AI:', err);
      setError(`Error: ${err.message || 'Failed to process speech with AI'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const createQuizFromJson = () => {
    try {
      const quizData = JSON.parse(jsonOutput);
      
      // Generate IDs if they don't exist
      const quiz: Quiz = {
        id: crypto.randomUUID(),
        title: quizData.title || 'Untitled Quiz',
        description: quizData.description || '',
        questions: []
      };
      
      // Process questions
      quiz.questions = (quizData.questions || []).map((q: any): Question => {
        const questionId = crypto.randomUUID();
        
        // For each question type, prepare appropriate data
        let options: Option[] = [];
        let correctAnswerId = '';
        
        if (q.type === 'multiple-choice' || q.type === 'true-false') {
          options = (q.options || []).map((opt: any): Option => {
            const optionId = crypto.randomUUID();
            return { id: optionId, text: opt.text || '' };
          });
          
          // Set correct answer ID if specified
          if (q.correctAnswerId !== undefined && options.length > 0) {
            // If correctAnswerId is an index, convert to the actual ID
            if (typeof q.correctAnswerId === 'number') {
              const index = Math.min(Math.max(0, q.correctAnswerId), options.length - 1);
              correctAnswerId = options[index].id;
            } else if (typeof q.correctAnswerId === 'string' && options.find(o => o.id === q.correctAnswerId)) {
              correctAnswerId = q.correctAnswerId;
            } else {
              // Default to first option if not specified correctly
              correctAnswerId = options[0].id;
            }
          }
        }
        
        return {
          id: questionId,
          text: q.text || '',
          type: q.type || 'multiple-choice',
          options,
          correctAnswerId,
          sampleAnswer: q.sampleAnswer || ''
        };
      });
      
      onQuizData(quiz);
      setTranscript('');
      setJsonOutput('');
      setShowJsonEditor(false);
      
    } catch (err: any) {
      console.error('Error parsing quiz data:', err);
      setError(`Failed to parse quiz data: ${err.message}`);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonOutput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  // Helper function to get a basic example JSON
  const getExampleJson = () => {
    const example = {
      "title": "Example Quiz",
      "description": "A simple example quiz",
      "questions": [
        {
          "text": "What is the capital of France?",
          "type": "multiple-choice",
          "options": [
            { "text": "London" },
            { "text": "Berlin" },
            { "text": "Paris" },
            { "text": "Madrid" }
          ],
          "correctAnswerId": 2
        },
        {
          "text": "Is the sky blue?",
          "type": "true-false",
          "options": [
            { "text": "True" },
            { "text": "False" }
          ],
          "correctAnswerId": 0
        },
        {
          "text": "Explain how photosynthesis works.",
          "type": "subjective",
          "sampleAnswer": "Photosynthesis is the process by which plants convert light energy into chemical energy."
        }
      ]
    };
    return JSON.stringify(example, null, 2);
  };

  const validateJson = () => {
    try {
      const parsed = JSON.parse(jsonOutput);
      
      if (!parsed.title || typeof parsed.title !== 'string') {
        return "Quiz title is required";
      }
      
      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        return "At least one question is required";
      }
      
      for (const q of parsed.questions) {
        if (!q.text || typeof q.text !== 'string') {
          return "Question text is required";
        }
        
        if (!['multiple-choice', 'true-false', 'subjective'].includes(q.type)) {
          return `Invalid question type: ${q.type}`;
        }
        
        if ((q.type === 'multiple-choice' || q.type === 'true-false') && 
            (!Array.isArray(q.options) || q.options.length < 2)) {
          return `Question "${q.text}" needs at least 2 options`;
        }
        
        if ((q.type === 'multiple-choice' || q.type === 'true-false') && 
            (q.correctAnswerId === undefined || q.correctAnswerId === null)) {
          return `Question "${q.text}" needs a correct answer`;
        }
      }
      
      return null;
    } catch (err: any) {
      return `Invalid JSON: ${err.message}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8">
      <h3 className="text-lg md:text-xl font-bold mb-4">Create Quiz with Voice</h3>
      
      {!showJsonEditor ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="openai"
                  checked={provider === 'openai'}
                  onChange={() => setProvider('openai')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">OpenAI</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="anthropic"
                  checked={provider === 'anthropic'}
                  onChange={() => setProvider('anthropic')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Anthropic</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {provider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Speech Input</p>
            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                placeholder="Your spoken quiz content will appear here. You can also type or edit directly."
              />
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setIsListening(!isListening)}
                  className={`p-2 rounded-full ${isListening ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                  disabled={isProcessing}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {isListening ? 'Listening... Speak clearly to describe your quiz.' : 'Click the microphone button to start speaking.'}
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={processTranscriptWithAI}
              disabled={isProcessing || !transcript.trim()}
              className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Generate Quiz from Speech'}
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Instructions</h4>
            <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
              <li>Click the microphone button and speak clearly to describe your quiz</li>
              <li>Include the quiz title, description, and questions</li>
              <li>For multiple-choice questions, list the options and mention which is correct</li>
              <li>For true/false questions, specify if the answer is true or false</li>
              <li>For subjective questions, provide a sample answer if possible</li>
              <li>Click "Generate Quiz from Speech" when done speaking</li>
            </ul>
            <p className="mt-3 text-sm text-blue-700">Example: "Create a quiz titled 'Science Basics' with description 'Test your knowledge of basic science concepts'. First question: 'What is the chemical symbol for water?' with options 'H2O', 'CO2', 'O2', and 'N2'. The correct answer is 'H2O'."</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Edit Quiz JSON
              </label>
              <div className="flex gap-2">
                <button
                  onClick={formatJson}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  title="Format JSON"
                >
                  Format
                </button>
                <button
                  onClick={() => setJsonOutput(getExampleJson())}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  title="View example JSON"
                >
                  Example
                </button>
              </div>
            </div>
            <textarea
              value={jsonOutput}
              onChange={(e) => setJsonOutput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
              style={{ minHeight: '400px' }}
              spellCheck="false"
            />
            <div className="text-xs text-gray-500 mt-1">
              Edit the JSON directly if needed. The "correctAnswerId" for multiple-choice questions can be the index of the correct option (0-based).
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={() => {
                setShowJsonEditor(false);
                setError(null);
              }}
              className="py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Back to Speech Input
            </button>
            <button
              onClick={() => {
                const validationError = validateJson();
                if (validationError) {
                  setError(validationError);
                } else {
                  createQuizFromJson();
                }
              }}
              className="py-2 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Create Quiz
            </button>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">JSON Schema</h4>
            <p className="text-sm text-yellow-700 mb-2">Your JSON should follow this structure:</p>
            <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
              <li><code>title</code>: String (required)</li>
              <li><code>description</code>: String (optional)</li>
              <li><code>questions</code>: Array of question objects (required)</li>
              <li>Each question needs: <code>text</code>, <code>type</code> ("multiple-choice", "true-false", or "subjective")</li>
              <li>For multiple-choice/true-false questions: <code>options</code> array and <code>correctAnswerId</code></li>
              <li>For subjective questions: <code>sampleAnswer</code> (optional)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechQuizBuilder; 