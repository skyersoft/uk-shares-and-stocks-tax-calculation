import React from 'react';

interface BrokerDetectionBadgeProps {
    broker: string;
    confidence: number;
    status: 'detecting' | 'detected' | 'error';
    className?: string;
}

export const BrokerDetectionBadge: React.FC<BrokerDetectionBadgeProps> = ({
    broker,
    confidence,
    status,
    className = ''
}) => {
    const getStatusIcon = () => {
        switch (status) {
            case 'detecting':
                return <i className="fas fa-spinner fa-spin me-2"></i>;
            case 'detected':
                return <i className="fas fa-check-circle me-2"></i>;
            case 'error':
                return <i className="fas fa-exclamation-triangle me-2"></i>;
        }
    };

    const getStatusClass = () => {
        switch (status) {
            case 'detecting':
                return 'bg-info text-white';
            case 'detected':
                return confidence >= 0.8 ? 'bg-success text-white' : 'bg-warning text-dark';
            case 'error':
                return 'bg-danger text-white';
        }
    };

    const getConfidenceText = () => {
        if (status !== 'detected') return '';
        const percentage = Math.round(confidence * 100);
        if (percentage >= 90) return 'High confidence';
        if (percentage >= 70) return 'Good confidence';
        return 'Low confidence';
    };

    return (
        <div className={`broker-detection-badge ${className}`}>
            <div className={`badge ${getStatusClass()} d-inline-flex align-items-center px-3 py-2`}>
                {getStatusIcon()}
                <div className="d-flex flex-column align-items-start">
                    <span className="fw-bold">{broker}</span>
                    {status === 'detected' && (
                        <small className="opacity-75">
                            {getConfidenceText()} ({Math.round(confidence * 100)}%)
                        </small>
                    )}
                </div>
            </div>
        </div>
    );
};
