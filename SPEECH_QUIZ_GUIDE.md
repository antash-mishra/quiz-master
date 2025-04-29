# Voice-to-Quiz Feature User Guide

## Overview

The Voice-to-Quiz feature allows you to create quizzes using speech recognition and AI processing. Simply speak your quiz content, and the system will convert it into a structured quiz with questions, options, and correct answers.

## Requirements

- A modern browser that supports the Web Speech API (Chrome, Edge, Safari 14.1+)
- An API key from OpenAI or Anthropic
- A stable internet connection

## How to Use

### 1. Access the Quiz Builder

Navigate to the Quiz Builder page by logging in as an admin and clicking "Create Quiz" in the admin dashboard.

### 2. Switch to Voice Input Mode

Click the "Use Voice Input" button in the top-right corner of the page.

### 3. Configure API Settings

- Select either "OpenAI" or "Anthropic" as your AI provider
- Enter your API key in the designated field
  - For OpenAI, you'll need a GPT-4 enabled API key
  - For Anthropic, you'll need a Claude-3 enabled API key

### 4. Speak Your Quiz Content

1. Click the microphone button to start recording
2. Speak clearly and naturally about your quiz
3. Click the microphone button again to stop recording (or continue speaking)
4. Review the transcribed content in the text area
5. Edit the transcription if needed
6. Click "Generate Quiz from Speech" to process your input

### 5. Review and Edit JSON

After processing your speech, the system will:
1. Display the structured quiz data in JSON format
2. Allow you to edit the JSON directly before final creation
3. Provide format and example buttons to help with editing
4. Validate your JSON to ensure it follows the correct structure

The JSON editor includes:
- A large text area for direct JSON editing
- A "Format" button to properly indent and format your JSON
- An "Example" button to see a sample quiz structure
- A validation system that checks for errors before submission
- A schema guide showing the required fields and structure

### 6. Create Quiz from JSON

1. Review the generated JSON and make any necessary adjustments
2. Click "Create Quiz" to finalize your quiz
3. The system will create a new quiz based on your JSON
4. You'll be returned to the standard quiz builder interface with your quiz added

### 7. Review and Edit Generated Quiz

After the JSON is processed:
1. Add any additional questions if needed
2. Make final adjustments to titles, descriptions, or questions
3. Save the quiz when you're satisfied

## Voice Input Tips

For best results, structure your spoken quiz as follows:

```
Create a quiz titled "Your Quiz Title" with the description "Your quiz description".

The first question is "Your question text?" 
This is a multiple-choice question with the following options:
1. First option
2. Second option
3. Third option
4. Fourth option
The correct answer is the second option.

The second question is "Your next question?"
This is a true-false question.
The answer is true.

The third question is "Your subjective question?"
This is a subjective question.
A good sample answer would be "Your sample answer text."
```

## JSON Editing Tips

When editing the JSON:

- Ensure all required fields are present (title, questions array)
- For multiple-choice questions, include an array of options and specify the correctAnswerId
- The correctAnswerId can be the index of the correct option (0 for first option, 1 for second, etc.)
- Format the JSON if it becomes hard to read (using the Format button)
- Reference the Example if you're unsure about the structure
- Check the schema guide at the bottom of the editor for field requirements

## Example

Here's an example of a good voice input:

"Create a quiz titled 'Computer Science Basics' with the description 'Test your knowledge of fundamental computer science concepts.' 

The first question is 'What does CPU stand for?' This is a multiple-choice question with options: 'Central Processing Unit', 'Computer Personal Unit', 'Central Processor Underlying', and 'Central Program Utility'. The correct answer is 'Central Processing Unit'.

The second question is 'Is Python a compiled language?' This is a true-false question. The answer is false.

The third question is 'Explain the difference between a stack and a queue.' This is a subjective question. A sample answer would be 'A stack uses LIFO (Last In, First Out) while a queue uses FIFO (First In, First Out) processing order.'"

## Troubleshooting

- **Microphone not working**: Ensure your browser has permission to access your microphone
- **API errors**: Verify your API key is correct and has sufficient credits
- **Poor recognition**: Speak clearly, minimize background noise, and use proper punctuation words
- **Incorrect quiz structure**: Follow the example format to ensure the AI correctly identifies questions, options, and answers
- **JSON validation errors**: Check the error message and correct the JSON structure accordingly
- **JSON parsing issues**: Make sure your JSON is properly formatted with all quotes and brackets balanced

---

For any technical assistance, please contact support at support@quizmaster.com 