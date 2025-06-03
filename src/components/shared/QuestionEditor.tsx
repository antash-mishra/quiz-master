import React from 'react';
import { Question, Option, QuestionType } from '../../types';
import { Check, Plus, X, HelpCircle, List, FileText } from 'lucide-react';
import ModernSelect from './ModernSelect';
import ModernInput from './ModernInput';
import LaTeXInput from '../LaTeXInput';

interface QuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  showSaveCancel?: boolean;
  error?: string;
}

export default function QuestionEditor({
  question,
  onChange,
  onSave,
  onCancel,
  isEditing = false,
  showSaveCancel = false,
  error
}: QuestionEditorProps) {
  
  const handleQuestionChange = (field: keyof Question, value: any) => {
    onChange({
      ...question,
      [field]: value
    });
  };

  const handleOptionChange = (optionId: string, text: string) => {
    const newOptions = question.options.map(opt =>
      opt.id === optionId ? { ...opt, text } : opt
    );
    onChange({
      ...question,
      options: newOptions
    });
  };

  const addOption = () => {
    const newOption: Option = {
      id: crypto.randomUUID(),
      text: ''
    };
    onChange({
      ...question,
      options: [...question.options, newOption]
    });
  };

  const removeOption = (optionId: string) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter(opt => opt.id !== optionId);
      onChange({
        ...question,
        options: newOptions,
        // Clear correct answer if it was the removed option
        correctAnswerId: question.correctAnswerId === optionId ? '' : question.correctAnswerId
      });
    }
  };

  const questionTypeOptions = [
    {
      value: 'multiple-choice',
      label: 'Multiple Choice',
      icon: List
    },
    {
      value: 'true-false',
      label: 'True/False',
      icon: Check
    },
    {
      value: 'subjective',
      label: 'Subjective',
      icon: FileText
    }
  ];

  const renderQuestionTypeSelector = () => (
    <ModernSelect
      label="Question Type"
      value={question.type}
      onChange={(value) => handleQuestionChange('type', value as QuestionType)}
      options={questionTypeOptions}
      placeholder="Select question type"
    />
  );

  const renderQuestionText = () => (
    <LaTeXInput
      label="Question Text"
      value={question.text}
      onChange={(value) => handleQuestionChange('text', value)}
      placeholder="Enter your question here..."
      multiline={true}
      rows={3}
      name={`question-text-${question.id}`}
    />
  );

  const renderOptions = () => {
    if (question.type === 'subjective') return null;

    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Answer Options <span className="text-gray-500 text-xs">(LaTeX supported)</span>
        </label>
        
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div key={option.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg border-2 border-gray-300 flex-shrink-0">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctAnswerId === option.id}
                    onChange={() => handleQuestionChange('correctAnswerId', option.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <LaTeXInput
                    value={option.text}
                    onChange={(value) => handleOptionChange(option.id, value)}
                    placeholder={`Option ${index + 1}`}
                    name={`option-${option.id}`}
                  />
                </div>
              </div>
              
              {question.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                  title="Remove option"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {question.type === 'multiple-choice' && question.options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Option</span>
          </button>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    if (!showSaveCancel) return null;

    return (
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Check className="h-4 w-4" />
          <span>Save Question</span>
        </button>
      </div>
    );
  };

  return (
    <div className={`p-4 sm:p-6 border-2 rounded-2xl transition-all duration-200 ${
      isEditing 
        ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
    }`}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {renderQuestionTypeSelector()}
        </div>
        
        {renderQuestionText()}
        {renderOptions()}
        
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5">
              <HelpCircle className="h-5 w-5" />
            </div>
            <p className="text-red-700 font-medium text-sm">{error}</p>
          </div>
        )}
        
        {renderActionButtons()}
      </div>
    </div>
  );
} 