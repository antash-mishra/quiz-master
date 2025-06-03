import React from 'react';
import { Question, Option, QuestionType } from '../../types';
import { Check, Plus, X, HelpCircle, List, FileText, Eye, Edit } from 'lucide-react';
import ModernSelect from './ModernSelect';
import ModernInput from './ModernInput';
import LaTeXInput from '../LaTeXInput';
import LaTeXRenderer from '../LaTeXRenderer';

interface QuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  showSaveCancel?: boolean;
  error?: string;
  showPreview?: boolean;
}

export default function QuestionEditor({
  question,
  onChange,
  onSave,
  onCancel,
  isEditing = false,
  showSaveCancel = false,
  error,
  showPreview = false
}: QuestionEditorProps) {
  const [viewMode, setViewMode] = React.useState<'edit' | 'preview'>(showPreview ? 'preview' : 'edit');
  
  // Update view mode when showPreview prop changes
  React.useEffect(() => {
    if (showPreview) {
      setViewMode('preview');
    }
  }, [showPreview, question.id]); // Also depend on question.id to reset for new questions

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

  const renderViewModeToggle = () => {
    if (!showPreview) return null;

    return (
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 w-full max-w-full overflow-hidden">
        <h4 className="text-base font-semibold text-gray-900 truncate">Question Review</h4>
        <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-sm text-xs font-medium transition-all ${
              viewMode === 'edit'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Edit className="h-3 w-3" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-sm text-xs font-medium transition-all ${
              viewMode === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="h-3 w-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>
    );
  };

  const renderQuestionTypeSelector = () => (
    <ModernSelect
      label="Question Type"
      value={question.type}
      onChange={(value) => handleQuestionChange('type', value as QuestionType)}
      options={questionTypeOptions}
      placeholder="Select question type"
    />
  );

  const renderQuestionText = () => {
    if (showPreview && viewMode === 'preview') {
      return (
        <div className="space-y-2 w-full max-w-full overflow-hidden">
          <label className="block text-xs font-medium text-gray-700">Question Text</label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px] flex items-start w-full max-w-full overflow-hidden">
            <div className="w-full max-w-full overflow-hidden">
              <LaTeXRenderer content={question.text} className="text-sm leading-relaxed break-words overflow-wrap-anywhere" />
            </div>
          </div>
        </div>
      );
    }

    return (
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
  };

  const renderOptionsPreview = () => {
    if (question.type === 'subjective') return null;

    return (
      <div className="space-y-3 w-full max-w-full overflow-hidden">
        <label className="block text-xs font-medium text-gray-700">
          Answer Options
        </label>
        
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <div 
              key={option.id} 
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all w-full max-w-full overflow-hidden ${
                question.correctAnswerId === option.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                question.correctAnswerId === option.id
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 bg-white text-gray-600'
              }`}>
                {question.correctAnswerId === option.id ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="text-xs font-medium">{String.fromCharCode(65 + index)}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <LaTeXRenderer content={option.text} inline={true} className="text-xs break-words overflow-wrap-anywhere" />
              </div>
              
              {question.correctAnswerId === option.id && (
                <div className="flex items-center text-green-600 text-xs font-medium">
                  <Check className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Correct</span>
                  <span className="sm:hidden">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOptions = () => {
    if (question.type === 'subjective') return null;

    if (showPreview && viewMode === 'preview') {
      return renderOptionsPreview();
    }

    return (
      <div className="space-y-3 w-full max-w-full overflow-hidden">
        <label className="block text-xs font-medium text-gray-700">
          Answer Options <span className="text-gray-500 text-xs">(LaTeX supported)</span>
        </label>
        
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <div key={option.id} className="flex flex-col gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 w-full max-w-full overflow-hidden">
              <div className="flex items-center space-x-2 w-full">
                <div className="flex items-center justify-center w-6 h-6 bg-white rounded-md border-2 border-gray-300 flex-shrink-0">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctAnswerId === option.id}
                    onChange={() => handleQuestionChange('correctAnswerId', option.id)}
                    className="h-3 w-3 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                
                {question.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    className="flex items-center justify-center w-6 h-6 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200 flex-shrink-0"
                    title="Remove option"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {question.type === 'multiple-choice' && question.options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center justify-center space-x-1 w-full px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg transition-all duration-200 text-xs font-medium"
          >
            <Plus className="h-3 w-3" />
            <span>Add Option</span>
          </button>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    if (!showSaveCancel) return null;

    return (
      <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 w-full">
        <button
          type="button"
          onClick={onCancel}
          className="w-full px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-xs"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-1 font-medium shadow-md hover:shadow-lg text-xs"
        >
          <Check className="h-3 w-3" />
          <span>Save Question</span>
        </button>
      </div>
    );
  };

  return (
    <div className={`p-3 border-2 rounded-lg transition-all duration-200 w-full max-w-full overflow-hidden ${
      isEditing 
        ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md' 
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
    }`}>
      <div className="space-y-4 w-full max-w-full overflow-hidden">
        {renderViewModeToggle()}
        
        <div className="grid grid-cols-1 gap-4 w-full max-w-full overflow-hidden">
          {(!showPreview || viewMode === 'edit') && renderQuestionTypeSelector()}
        </div>
        
        {renderQuestionText()}
        {renderOptions()}
        
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start space-x-2 w-full max-w-full overflow-hidden">
            <div className="flex-shrink-0 w-4 h-4 text-red-600 mt-0.5">
              <HelpCircle className="h-4 w-4" />
            </div>
            <p className="text-red-700 font-medium text-xs break-words overflow-wrap-anywhere">{error}</p>
          </div>
        )}
        
        {renderActionButtons()}
      </div>
    </div>
  );
} 