import React, { useState } from 'react';
import { Quiz, Question, Option } from '../types';

interface ImageQuizBuilderProps {
  onQuizData: (quizData: Quiz) => void;
}

const ImageQuizBuilder: React.FC<ImageQuizBuilderProps> = ({ onQuizData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    setImages(prevImages => [...prevImages, ...newFiles]);
    
    // Generate previews for the new images
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const processImagesWithOpenAI = async (imageData: string): Promise<Question | null> => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract a quiz question from this image. Extract the question text, question type (multiple-choice, true-false, or subjective), options, and correct answer if present. Return JSON in this format:
                  {
                    "text": "Question text",
                    "type": "multiple-choice" | "true-false" | "subjective",
                    "options": [{"text": "Option A"}, {"text": "Option B"}],
                    "correctAnswerId": 0 (index of correct option)
                  }
                  For true-false questions, provide exactly two options: "True" and "False".
                  For subjective questions, include a "sampleAnswer" field but no options or correctAnswerId.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to process with OpenAI');
      }

      const content = data.choices[0].message.content;
      
      // Extract JSON from the response (it might be wrapped in ```json or other markdown)
      let jsonStr = content.trim();
      const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim();
      }

      // Parse the JSON
      const questionData = JSON.parse(jsonStr);
      
      // Generate unique IDs for the question and options
      const questionId = crypto.randomUUID();
      let options: Option[] = [];
      let correctAnswerId = '';
      
      if (questionData.type === 'multiple-choice' || questionData.type === 'true-false') {
        options = (questionData.options || []).map((opt: any): Option => {
          const optionId = crypto.randomUUID();
          return { id: optionId, text: opt.text || '' };
        });
        
        // Set correct answer ID if specified
        if (questionData.correctAnswerId !== undefined && options.length > 0) {
          // If correctAnswerId is an index, convert to the actual ID
          if (typeof questionData.correctAnswerId === 'number') {
            const index = Math.min(Math.max(0, questionData.correctAnswerId), options.length - 1);
            correctAnswerId = options[index].id;
          } else if (typeof questionData.correctAnswerId === 'string' && options.find(o => o.id === questionData.correctAnswerId)) {
            correctAnswerId = questionData.correctAnswerId;
          } else {
            // Default to first option if not specified correctly
            correctAnswerId = options[0].id;
          }
        }
      }
      
      return {
        id: questionId,
        text: questionData.text || '',
        type: questionData.type || 'multiple-choice',
        options,
        correctAnswerId,
        sampleAnswer: questionData.sampleAnswer || ''
      };
      
    } catch (err: any) {
      console.error('Error processing image with OpenAI:', err);
      setError(`Error processing image: ${err.message}`);
      return null;
    }
  };

  const processImagesWithGemini = async (imageData: string): Promise<Question | null> => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract a quiz question from this image. Extract the question text, question type (multiple-choice, true-false, or subjective), options, and correct answer if present. Return JSON in this format:
                  {
                    "text": "Question text",
                    "type": "multiple-choice" | "true-false" | "subjective",
                    "options": [{"text": "Option A"}, {"text": "Option B"}],
                    "correctAnswerId": 0 (index of correct option)
                  }
                  For true-false questions, provide exactly two options: "True" and "False".
                  For subjective questions, include a "sampleAnswer" field but no options or correctAnswerId.
                  
                  Return ONLY valid JSON without any explanation or markdown formatting.`
                },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: imageData.split(',')[1] // Remove the data:image/jpeg;base64, part
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to process with Gemini');
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Gemini response:', content);
      if (!content) {
        throw new Error('Gemini response did not contain expected content.');
      }
      
      // Extract JSON from the response (it might be wrapped in ```json or other markdown)
      let jsonStr = content.trim();
      const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim();
      }

      // Parse the JSON
      const questionData = JSON.parse(jsonStr);
      
      // Generate unique IDs for the question and options
      const questionId = crypto.randomUUID();
      let options: Option[] = [];
      let correctAnswerId = '';
      
      if (questionData.type === 'multiple-choice' || questionData.type === 'true-false') {
        options = (questionData.options || []).map((opt: any): Option => {
          const optionId = crypto.randomUUID();
          return { id: optionId, text: opt.text || '' };
        });
        
        // Set correct answer ID if specified
        if (questionData.correctAnswerId !== undefined && options.length > 0) {
          // If correctAnswerId is an index, convert to the actual ID
          if (typeof questionData.correctAnswerId === 'number') {
            const index = Math.min(Math.max(0, questionData.correctAnswerId), options.length - 1);
            correctAnswerId = options[index].id;
          } else if (typeof questionData.correctAnswerId === 'string' && options.find(o => o.id === questionData.correctAnswerId)) {
            correctAnswerId = questionData.correctAnswerId;
          } else {
            // Default to first option if not specified correctly
            correctAnswerId = options[0].id;
          }
        }
      }
      
      return {
        id: questionId,
        text: questionData.text || '',
        type: questionData.type || 'multiple-choice',
        options,
        correctAnswerId,
        sampleAnswer: questionData.sampleAnswer || ''
      };
      
    } catch (err: any) {
      console.error('Error processing image with Gemini:', err);
      setError(`Error processing image: ${err.message}`);
      return null;
    }
  };

  const processImages = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image first.');
      return;
    }

    if (!apiKey.trim()) {
      setError(`Please enter your ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key.`);
      return;
    }

    if (!title.trim()) {
      setError('Please enter a quiz title.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('processing');
    setError(null);
    setExtractedQuestions([]);

    try {
      const extractedQuestions: Question[] = [];

      for (let i = 0; i < images.length; i++) {
        // Convert image to base64
        const imageData = previewImages[i];
        
        // Process with selected provider
        let question: Question | null = null;
        if (provider === 'openai') {
          question = await processImagesWithOpenAI(imageData);
        } else {
          question = await processImagesWithGemini(imageData);
        }
        
        if (question) {
          extractedQuestions.push(question);
        }
      }

      if (extractedQuestions.length === 0) {
        throw new Error('Could not extract any valid questions from the images.');
      }

      setExtractedQuestions(extractedQuestions);
      setProcessingStatus('complete');
      
    } catch (err: any) {
      console.error('Error processing images:', err);
      setError(`Error: ${err.message || 'Failed to process images'}`);
      setProcessingStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const createQuiz = () => {
    if (extractedQuestions.length === 0) {
      setError('No questions have been extracted. Please process images first.');
      return;
    }

    // Create a quiz with the user-provided metadata and the extracted questions
    const quiz: Quiz = {
      id: crypto.randomUUID(),
      title: title,
      description: description,
      questions: extractedQuestions
    };
    
    onQuizData(quiz);
    
    // Clear the state for the next quiz
    setImages([]);
    setPreviewImages([]);
    setExtractedQuestions([]);
    setProcessingStatus('idle');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8">
      <h3 className="text-lg md:text-xl font-bold mb-4">Create Quiz from Images</h3>
      
      <div className="space-y-6">
        {/* Quiz Metadata */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz description"
              rows={3}
            />
          </div>
        </div>

        {/* AI Provider Selection */}
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
              <span className="ml-2">OpenAI (GPT-4 Vision)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="gemini"
                checked={provider === 'gemini'}
                onChange={() => setProvider('gemini')}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Gemini Pro Vision</span>
            </label>
          </div>
        </div>
        
        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {provider === 'openai' ? 'OpenAI' : 'Gemini'} API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key`}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Upload Question Images
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mb-1 text-sm text-gray-500">Click to upload images</p>
                <p className="text-xs text-gray-500">PNG, JPG, or GIF</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload}
                disabled={isProcessing}
              />
            </label>
          </div>
          
          {/* Image Previews */}
          {previewImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    disabled={isProcessing}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {/* Process Button */}
        <div className="flex justify-end">
          <button
            onClick={processImages}
            disabled={isProcessing || images.length === 0 || !apiKey.trim() || !title.trim()}
            className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Images...
              </>
            ) : 'Process Images'}
          </button>
        </div>
        
        {/* Extracted Questions */}
        {extractedQuestions.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-3">Extracted Questions ({extractedQuestions.length})</h4>
            
            <div className="space-y-4">
              {extractedQuestions.map((question, index) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                  <h5 className="text-base md:text-lg font-medium text-gray-800 mb-2">
                    {index + 1}. {question.text}
                  </h5>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Type: {question.type}
                  </p>
                  
                  {question.type !== 'subjective' && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Options:</p>
                      <ul className="mt-1 pl-5 list-disc text-sm text-gray-600">
                        {question.options.map((option) => (
                          <li key={option.id} className={option.id === question.correctAnswerId ? 'font-semibold text-green-600' : ''}>
                            {option.text} {option.id === question.correctAnswerId && '(Correct)'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {question.type === 'subjective' && question.sampleAnswer && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Sample Answer:</p>
                      <p className="text-sm text-gray-600 mt-1 italic">{question.sampleAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={createQuiz}
              className="w-full mt-4 py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Create Quiz with Extracted Questions
            </button>
          </div>
        )}
        
        {/* Instructions */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Instructions</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            <li>Enter the quiz title and description manually</li>
            <li>Select your preferred AI vision model (OpenAI GPT-4V or Gemini Vision)</li>
            <li>Upload images of quiz questions - each image should contain one complete question</li>
            <li>The AI will extract the question text, options, and identify the correct answer</li>
            <li>Review the extracted questions and make any needed adjustments</li>
            <li>Click "Create Quiz" when you're satisfied with the results</li>
          </ul>
          <p className="mt-3 text-sm text-blue-700">Best results come from clear images with readable text and a single question format per image.</p>
        </div>
      </div>
    </div>
  );
};

export default ImageQuizBuilder; 