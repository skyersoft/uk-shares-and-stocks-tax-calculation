import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';

const NotFoundPage: React.FC = () => {
    return (
        <div className="container py-5 text-center">
            <SEOHead
                title="Page Not Found - IBKR Tax Calculator"
                description="The page you are looking for does not exist."
            />
            <div className="row justify-content-center">
                <div className="col-lg-6 col-md-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-5">
                            <h1 className="display-1 fw-bold text-primary mb-3">404</h1>
                            <h2 className="h4 mb-4">Oops! Page not found</h2>
                            <p className="text-muted mb-5">
                                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                            </p>
                            <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                                <Link to="/" className="btn btn-primary px-4 gap-3">
                                    Return to Homepage
                                </Link>
                                <Link to="/blog" className="btn btn-outline-secondary px-4">
                                    Visit our Blog
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
