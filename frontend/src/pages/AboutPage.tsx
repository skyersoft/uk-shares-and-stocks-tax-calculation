import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-body">
              <h1 className="card-title">About IBKR Tax Calculator</h1>
              <p className="lead">
                A comprehensive UK Capital Gains Tax calculator designed specifically for Interactive Brokers and other trading platform users.
              </p>
              
              <h2>Features</h2>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Accurate CGT calculations following HMRC guidelines</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Support for QFX and CSV file imports</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Real-time calculation updates</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Detailed breakdown of gains and losses</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Section 104 holding calculations</li>
              </ul>
              
              <h2>Data Privacy</h2>
              <p>
                Your financial data is processed locally in your browser. No data is stored on our servers, ensuring complete privacy and security.
              </p>
              
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                This calculator is provided for informational purposes only. Always consult with a qualified tax advisor for official tax guidance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;