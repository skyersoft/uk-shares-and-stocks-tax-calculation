import React, { useState } from 'react';

const MAX_CHARS = 1000;

export const FeedbackForm: React.FC = () => {
    const [message, setMessage] = useState('');
    const [contact, setContact] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) return;

        setStatus('submitting');
        setErrorMsg('');

        try {
            // CloudFront routes /prod/* to API Gateway
            const endpoint = '/prod/feedback';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, contact }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            setStatus('success');
            setMessage('');
            setContact('');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg('Something went wrong. Please try again later.');
        }
    };

    return (
        <div className="card shadow-sm mt-5">
            <div className="card-header bg-light">
                <h5 className="mb-0">Share Your Feedback</h5>
            </div>
            <div className="card-body">
                {status === 'success' ? (
                    <div className="alert alert-success">
                        <h6 className="alert-heading">Thank you!</h6>
                        <p className="mb-0">Your feedback has been received. We appreciate your input.</p>
                        <button
                            className="btn btn-sm btn-outline-success mt-3"
                            onClick={() => setStatus('idle')}
                        >
                            Send another message
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="feedbackMessage" className="form-label">
                                How can we improve this tool?
                            </label>
                            <textarea
                                id="feedbackMessage"
                                className="form-control"
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                maxLength={MAX_CHARS}
                                placeholder="Tell us about your experience, or report an issue..."
                                required
                                disabled={status === 'submitting'}
                            />
                            <div className="form-text text-end">
                                {message.length}/{MAX_CHARS} characters
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="contactInfo" className="form-label">
                                Contact (Optional)
                            </label>
                            <input
                                type="text"
                                id="contactInfo"
                                className="form-control"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="Email or Reddit username (if you'd like a response)"
                                disabled={status === 'submitting'}
                            />
                        </div>

                        {status === 'error' && (
                            <div className="alert alert-danger py-2 mb-3">
                                {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!message.trim() || status === 'submitting'}
                        >
                            {status === 'submitting' ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Sending...
                                </>
                            ) : 'Submit Feedback'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
