import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import QuizMetadataStep from './QuizMetadataStep';
import QuizQuestionsStep from './QuizQuestionsStep';

const QuizBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const step = parseInt(searchParams.get('step') || '1');
  const quizId = searchParams.get('quizId');

  const [quizMetadata, setQuizMetadata] = useState({
    id: quizId || crypto.randomUUID(),
    title: '',
    description: ''
  });

  const handleStepComplete = (data: any, nextStep: number) => {
    if (nextStep === 2) {
      // Moving from step 1 to step 2
      setQuizMetadata(data);
      navigate(`/admin/create?step=2&quizId=${data.id}`);
    } else if (nextStep === 3) {
      // Quiz completed
      navigate('/admin/responses');
    }
  };

  const handleBack = () => {
    if (step === 2) {
      navigate('/admin/create?step=1');
    } else {
      navigate('/admin');
    }
  };

  const steps = [
    { number: 1, title: 'Quiz Details', description: 'Create title and description' },
    { number: 2, title: 'Add Questions', description: 'Build your quiz questions' },
    { number: 3, title: 'Complete', description: 'Quiz ready to use' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((stepItem, index) => (
            <React.Fragment key={stepItem.number}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepItem.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepItem.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    stepItem.number
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    step >= stepItem.number ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {stepItem.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step > stepItem.number ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {step === 1 && (
          <QuizMetadataStep 
            onComplete={handleStepComplete}
            initialData={quizMetadata}
          />
        )}
        
        {step === 2 && quizId && (
          <QuizQuestionsStep 
            quizId={quizId}
            quizMetadata={quizMetadata}
            onComplete={handleStepComplete}
            onBack={handleBack}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        {step < 2 && (
          <div className="text-sm text-gray-500">
            Step {step} of 2
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBuilder;