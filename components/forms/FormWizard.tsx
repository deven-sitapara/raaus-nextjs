"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

export interface FormStep {
  title: string;
  description?: string;
  fields: React.ReactNode;
}

export interface FormWizardProps {
  steps: FormStep[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function FormWizard({
  steps,
  onSubmit,
  isSubmitting = false,
  currentStep,
  onStepChange,
}: FormWizardProps) {
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (isLastStep) {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center ${index < totalSteps - 1 ? "flex-1" : ""}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    index <= currentStep
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-500"
                  }`}
                >
                  {index < currentStep ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    index <= currentStep ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-colors ${
                    index < currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {steps[currentStep].title}
        </h2>
        {steps[currentStep].description && (
          <p className="text-black mb-6" style={{fontSize: '12px', color: '#000000'}}>{steps[currentStep].description}</p>
        )}
        <div className="space-y-4">{steps[currentStep].fields}</div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
        >
          Previous
        </Button>

        <div className="text-sm text-gray-600">
          Step {currentStep + 1} of {totalSteps}
        </div>

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
