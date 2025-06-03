import { Question, Option } from '../types';

export interface AIProvider {
  name: 'openai' | 'anthropic' | 'gemini';
  displayName: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  { name: 'openai', displayName: 'OpenAI' },
  { name: 'anthropic', displayName: 'Anthropic' },
  { name: 'gemini', displayName: 'Gemini' }
];

const LATEX_GUIDELINES = `
LaTeX Guidelines:
- Use $...$ for inline math: $x^2$, $E = mc^2$, $\\pi r^2$
- Use $$...$$ for display math: $$\\frac{a}{b}$$, $$\\int_0^1 x dx$$
- Common symbols: $\\alpha$, $\\beta$, $\\pi$, $\\theta$, $\\sum$, $\\int$, $\\sqrt{x}$
- Fractions: $\\frac{numerator}{denominator}$
- Superscripts/subscripts: $x^2$, $H_2O$
`;

const BASE_PROMPT = `
Extract a quiz question from this content. If the content contains mathematical, scientific, or technical content, use LaTeX notation for formulas and expressions.

${LATEX_GUIDELINES}

Return JSON in this format:
{
  "text": "Question text with LaTeX notation if applicable",
  "type": "multiple-choice" | "true-false" | "subjective",
  "options": [{"text": "Option A with LaTeX if needed"}, {"text": "Option B with LaTeX if needed"}],
  "correctAnswerId": 0,
  "sampleAnswer": "For subjective questions, sample answer with LaTeX if appropriate"
}

For true-false questions, provide exactly two options: "True" and "False".
For subjective questions, include a "sampleAnswer" field but no options or correctAnswerId.
`;

const SPEECH_PROMPT = `
Convert this spoken quiz question into a structured format.
If the transcription has some issues, try to fix them even the scientific formualas, check the capitalization and other details.
If the content involves mathematics, science, or technical subjects, use LaTeX notation:

For mathematics, science, or technical subjects, use LaTeX notation:
- Use $...$ for inline math (e.g., $x^2$, $\pi$, $E = mc^2$)
- Use $$...$$ for display math (e.g., $$\int_0^1 x dx$$)

LaTeX examples:
- Multiplication: $F = ma$, $P = VI$ (do NOT use fractions for simple multiplication)
- Actual fractions: $\frac{1}{2}mv^2$, $\frac{V^2}{R}$ (only when division is intended)
- Superscripts: $x^2$, $E = mc^2$
- Subscripts: $x_1$, $H_2O$
- Greek letters: $\alpha$, $\beta$, $\pi$, $\theta$
- Math functions: $\sin$, $\cos$, $\log$
- Square roots: $\sqrt{x}$

IMPORTANT: If you see "F=m/a" in transcription, this is likely "F=ma" (Newton's Second Law). 
Similarly, "V=I/R" is likely "V=IR" (Ohm's Law). Don't create fractions unless the formula genuinely requires division.

Return ONLY valid JSON in this exact format:
{
  "text": "Question text with LaTeX if appropriate",
  "type": "multiple-choice" | "true-false" | "subjective",
  "options": [
    {"text": "Option 1 with LaTeX if needed"},
    {"text": "Option 2 with LaTeX if needed"}
  ],
  "correctAnswerId": 0,
  "sampleAnswer": "For subjective questions, sample answer with LaTeX if appropriate"
}

For true-false questions, provide exactly two options: "True" and "False".
For subjective questions, include a "sampleAnswer" field but no options or correctAnswerId.
`;

export class AIQuestionProcessor {
  private apiKey: string;
  private provider: AIProvider['name'];

  constructor(apiKey: string, provider: AIProvider['name']) {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  async processImageToQuestion(imageData: string): Promise<Question | null> {
    try {
      let response;
      let content = '';

      if (this.provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: BASE_PROMPT },
                  { type: 'image_url', image_url: { url: imageData } }
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
        content = data.choices[0].message.content;

      } else if (this.provider === 'gemini') {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: BASE_PROMPT + '\nReturn ONLY valid JSON without any explanation or markdown formatting.' },
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: imageData.split(',')[1]
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
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!content) {
          throw new Error('Gemini response did not contain expected content.');
        }
      }

      return this.parseQuestionFromResponse(content);
    } catch (err: any) {
      console.error(`Error processing image with ${this.provider}:`, err);
      throw new Error(`Error processing image: ${err.message}`);
    }
  }

  async processSpeechToQuestion(transcript: string): Promise<string> {
    try {
      const prompt = SPEECH_PROMPT + `\n\nSpoken question: ${transcript}`;
      let response;
      let content = '';

      if (this.provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
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
        content = data.choices[0].message.content;

      } else if (this.provider === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
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
        content = data.content[0].text;

      } else if (this.provider === 'gemini') {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: prompt }] }
            ],
            generationConfig: {
              responseMimeType: "application/json",
            }
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to process with Gemini');
        }
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!content) {
          throw new Error('Gemini response did not contain expected content.');
        }
      }

      return this.extractJsonFromResponse(content);
    } catch (err: any) {
      console.error(`Error processing speech with ${this.provider}:`, err);
      throw new Error(`Error: ${err.message || 'Failed to process speech with AI'}`);
    }
  }

  private parseQuestionFromResponse(content: string): Question | null {
    try {
      const jsonStr = this.extractJsonFromResponse(content);
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
      console.error('Error parsing question from response:', err);
      return null;
    }
  }

  private extractJsonFromResponse(content: string): string {
    // Extract JSON from the response (it might be wrapped in ```json or other markdown)
    let jsonStr = content.trim();
    const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }
    return jsonStr;
  }
}

export function validateApiKey(provider: AIProvider['name'], apiKey: string): string | null {
  if (!apiKey.trim()) {
    return `Please enter your ${provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : 'Gemini'} API key.`;
  }
  return null;
} 