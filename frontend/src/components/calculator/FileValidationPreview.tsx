import React from 'react';
import { BrokerDetectionResult, TransactionPreview } from '../../services/api';
import { BrokerDetectionBadge } from './BrokerDetectionBadge';

interface FileValidationPreviewProps {
    detection: BrokerDetectionResult;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const FileValidationPreview: React.FC<FileValidationPreviewProps> = ({
    detection,
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (!detection.detected) {
        return (
            <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Could not detect broker</strong>
                <p className="mb-2 mt-2">{detection.error || 'Unknown error'}</p>
                {detection.supported_brokers && detection.supported_brokers.length > 0 && (
                    <div className="mt-2">
                        <small>Supported brokers: {detection.supported_brokers.join(', ')}</small>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="file-validation-preview card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="fas fa-file-alt me-2 text-primary"></i>
                        File Preview
                    </h5>
                    <BrokerDetectionBadge
                        broker={detection.broker!}
                        confidence={detection.confidence!}
                        status="detected"
                    />
                </div>
            </div>

            <div className="card-body">
                {/* File Information */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="d-flex align-items-start">
                            <i className="fas fa-file text-muted me-3 mt-1" style={{ fontSize: '1.5rem' }}></i>
                            <div>
                                <small className="text-muted d-block">Filename</small>
                                <strong>{detection.filename}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="d-flex align-items-start">
                            <i className="fas fa-calendar-alt text-muted me-3 mt-1" style={{ fontSize: '1.5rem' }}></i>
                            <div>
                                <small className="text-muted d-block">Date Range</small>
                                <strong>
                                    {detection.metadata?.date_range ? (
                                        <>
                                            {formatDate(detection.metadata.date_range.start)} -{' '}
                                            {formatDate(detection.metadata.date_range.end)}
                                        </>
                                    ) : (
                                        'N/A'
                                    )}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="text-center p-3 bg-light rounded">
                            <i className="fas fa-exchange-alt text-primary mb-2" style={{ fontSize: '2rem' }}></i>
                            <div className="h4 mb-0">{detection.metadata?.transaction_count || 0}</div>
                            <small className="text-muted">Transactions</small>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="text-center p-3 bg-light rounded">
                            <i className="fas fa-file-csv text-success mb-2" style={{ fontSize: '2rem' }}></i>
                            <div className="h4 mb-0">{detection.validation?.row_count || 0}</div>
                            <small className="text-muted">Rows</small>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="text-center p-3 bg-light rounded">
                            <i className="fas fa-check-circle text-info mb-2" style={{ fontSize: '2rem' }}></i>
                            <div className="h4 mb-0">{detection.validation?.valid ? 'Valid' : 'Invalid'}</div>
                            <small className="text-muted">Status</small>
                        </div>
                    </div>
                </div>

                {/* Validation Warnings/Errors */}
                {detection.validation && (detection.validation.errors.length > 0 || detection.validation.warnings.length > 0) && (
                    <div className="mb-4">
                        {detection.validation.errors.length > 0 && (
                            <div className="alert alert-danger mb-2">
                                <strong>Errors:</strong>
                                <ul className="mb-0 mt-2">
                                    {detection.validation.errors.map((error, idx) => (
                                        <li key={idx}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {detection.validation.warnings.length > 0 && (
                            <div className="alert alert-warning mb-2">
                                <strong>Warnings:</strong>
                                <ul className="mb-0 mt-2">
                                    {detection.validation.warnings.map((warning, idx) => (
                                        <li key={idx}>{warning}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Transaction Preview */}
                {detection.metadata?.transaction_preview && detection.metadata.transaction_preview.length > 0 && (
                    <div className="mb-4">
                        <h6 className="mb-3">
                            <i className="fas fa-eye me-2"></i>
                            Transaction Preview (first {detection.metadata.transaction_preview.length})
                        </h6>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Symbol</th>
                                        <th>Type</th>
                                        <th className="text-end">Quantity</th>
                                        <th className="text-end">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detection.metadata.transaction_preview.map((tx: TransactionPreview, idx: number) => (
                                        <tr key={idx}>
                                            <td>{formatDate(tx.date)}</td>
                                            <td><strong>{tx.symbol}</strong></td>
                                            <td>
                                                <span className={`badge ${tx.type === 'BUY' ? 'bg-success' :
                                                        tx.type === 'SELL' ? 'bg-danger' :
                                                            'bg-info'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="text-end">{tx.quantity.toFixed(2)}</td>
                                            <td className="text-end">{formatCurrency(tx.price, tx.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Alternative Brokers */}
                {detection.alternatives && detection.alternatives.length > 0 && (
                    <div className="alert alert-info">
                        <small>
                            <strong>Alternative matches:</strong>{' '}
                            {detection.alternatives.map((alt, idx) => (
                                <span key={idx}>
                                    {alt.broker} ({Math.round(alt.confidence * 100)}%)
                                    {idx < detection.alternatives!.length - 1 && ', '}
                                </span>
                            ))}
                        </small>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="card-footer bg-white border-0">
                <div className="d-flex justify-content-between">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        <i className="fas fa-times me-2"></i>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onConfirm}
                        disabled={isLoading || !detection.validation?.valid}
                    >
                        {isLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin me-2"></i>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check me-2"></i>
                                Continue with Calculation
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
