import React from 'react';
import { Question } from '../../types';
import { Edit2, X, Check, List, FileText } from 'lucide-react';
import LaTeXRenderer from '../LaTeXRenderer';

interface QuestionDisplayProps {
  question: Question;
  index: number;
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
  showActions?: boolean;
}

export default function QuestionDisplay({
  question,
  index,
  onEdit,
  onRemove,
  showActions = true
}: QuestionDisplayProps) {
  
  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'Multiple Choice';
      case 'true-false':
        return 'True/False';
      case 'subjective':
        return 'Subjective';
      default:
        return type;
    }
  };

  const getCorrectAnswerText = () => {
    if (question.type === 'subjective') {
      return 'Sample answer required';
    }
    const correctOption = question.options.find(opt => opt.id === question.correctAnswerId);
    return correctOption?.text || 'No correct answer selected';
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return List;
      case 'true-false':
        return Check;
      case 'subjective':
        return FileText;
      default:
        return List;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'true-false':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'subjective':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
              Question {index + 1}
            </span>
            <div className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-xl border w-fit ${getQuestionTypeColor(question.type)}`}>
              {React.createElement(getQuestionTypeIcon(question.type), { className: "h-3 w-3" })}
              <span>{getQuestionTypeLabel(question.type)}</span>
            </div>
          </div>
          
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 leading-relaxed break-words">
            <LaTeXRenderer content={question.text} inline={true} />
          </h3>
        </div>
        
        {showActions && (
          <div className="flex flex-row sm:flex-col gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(index)}
                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 transform hover:scale-105"
                title="Edit question"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-red-600 hover:bg-red-50 border-2 border-gray-200 hover:border-red-300 rounded-xl transition-all duration-200 transform hover:scale-105"
                title="Remove question"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Question Options */}
      {question.type !== 'subjective' && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Answer Options:</h4>
          <div className="grid grid-cols-1 gap-2">
            {question.options.map((option, optIndex) => (
              <div
                key={option.id}
                className={`flex items-start space-x-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                  option.id === question.correctAnswerId
                    ? 'bg-green-50 border-green-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-center w-6 h-6 flex-shrink-0 mt-0.5">
                  {option.id === question.correctAnswerId ? (
                    <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-500 bg-white border-2 border-gray-300 rounded-full w-6 h-6 flex items-center justify-center">
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                  )}
                </div>
                <span className="text-sm sm:text-base text-gray-900 leading-relaxed break-words flex-1">
                  <LaTeXRenderer content={option.text} inline={true} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct Answer Info */}
      <div className="pt-4 border-t-2 border-gray-100">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">
              {question.type === 'subjective' ? 'Sample Answer:' : 'Correct Answer:'}
            </span>
            <span className="text-sm sm:text-base text-gray-900 break-words">
              {question.type === 'subjective' 
                ? <LaTeXRenderer content={question.sampleAnswer || 'Not provided'} inline={true} />
                : <LaTeXRenderer content={getCorrectAnswerText()} inline={true} />
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 