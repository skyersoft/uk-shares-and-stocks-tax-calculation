import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ResultsCallToActionProps {
  onNewCalculation?: () => void;
  onLearnMore?: () => void;
  onGetHelp?: () => void;
  className?: string;
}

export const ResultsCallToAction: React.FC<ResultsCallToActionProps> = ({
  onNewCalculation,
  onLearnMore,
  onGetHelp,
  className = ''
}) => {
  const handleNewCalculation = () => {
    if (onNewCalculation) {
      onNewCalculation();
      return;
    }
    window.location.hash = '';
  };

  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore();
      return;
    }
    window.location.hash = 'about';
  };

  const handleGetHelp = () => {
    if (onGetHelp) {
      onGetHelp();
      return;
    }
    window.location.hash = 'help';
  };

  return (
    <Card className={`results-call-to-action shadow-sm border-0 text-center ${className}`}>
      <div className="mb-3">
        <h4 className="mb-2">Need Another Calculation?</h4>
        <p className="text-muted mb-0">
          Calculate taxes for different years or update your portfolio analysis
        </p>
      </div>
      <div className="d-flex flex-wrap justify-content-center gap-3">
        <Button variant="primary" onClick={handleNewCalculation}>
          <i className="fas fa-calculator me-2" aria-hidden="true"></i>
          New Calculation
        </Button>
        <Button variant="outline-primary" onClick={handleLearnMore}>
          <i className="fas fa-info-circle me-2" aria-hidden="true"></i>
          Learn More
        </Button>
        <Button variant="outline-secondary" onClick={handleGetHelp}>
          <i className="fas fa-question-circle me-2" aria-hidden="true"></i>
          Get Help
        </Button>
      </div>
    </Card>
  );
};

export default ResultsCallToAction;
