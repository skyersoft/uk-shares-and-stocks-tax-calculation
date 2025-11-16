import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: ReadonlyArray<{ readonly step: number; readonly title: string; readonly description: string }>;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps
}) => {
  return (
    <div className="progress-indicator mb-4">
      <div className="d-none d-md-flex justify-content-between align-items-start position-relative">
        {/* Progress line */}
        <div
          className="position-absolute top-0 start-0 bg-secondary"
          style={{
            height: '2px',
            width: '100%',
            top: '20px',
            zIndex: 0
          }}
        />
        <div
          className="position-absolute top-0 start-0 bg-primary"
          style={{
            height: '2px',
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            top: '20px',
            zIndex: 1,
            transition: 'width 0.3s ease'
          }}
        />

        {/* Step indicators */}
        {steps.map((step) => {
          const isActive = step.step === currentStep;
          const isCompleted = step.step < currentStep;
          const stepNumber = step.step;

          return (
            <div
              key={stepNumber}
              className="d-flex flex-column align-items-center"
              style={{ flex: 1, position: 'relative', zIndex: 2 }}
            >
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${
                  isActive
                    ? 'bg-primary text-white'
                    : isCompleted
                      ? 'bg-success text-white'
                      : 'bg-light border border-secondary text-muted'
                }`}
                style={{
                  width: '40px',
                  height: '40px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                {isCompleted ? (
                  <i className="fas fa-check"></i>
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              <div className="text-center" style={{ maxWidth: '150px' }}>
                <div
                  className={`small fw-bold ${
                    isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile view - simplified */}
      <div className="d-md-none">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="fw-bold text-primary">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="badge bg-primary">{Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)}%</span>
        </div>
        <div className="progress" style={{ height: '8px' }}>
          <div
            className="progress-bar bg-primary"
            role="progressbar"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          />
        </div>
        <div className="mt-2">
          <div className="fw-bold">{steps[currentStep - 1].title}</div>
          <div className="text-muted small">{steps[currentStep - 1].description}</div>
        </div>
      </div>
    </div>
  );
};
