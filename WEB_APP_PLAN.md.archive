# Web Application Implementation Plan

This file tracks the implementation of a deployable web application for the UK Capital Gains Tax Calculator.

## Sprint 1: Web Application Setup

### Task Breakdown

| ID    | Component               | Task Description                                          | Test Type    | Dependencies | Status |
|-------|------------------------|----------------------------------------------------------|--------------|--------------|--------|
| W1.1  | Infrastructure         | Set up Flask web application structure                    | Infrastructure | None       | Done   |
| W1.2  | Infrastructure         | Create unit test framework for web components             | Unit         | W1.1         | Done   |
| W1.3  | Infrastructure         | Set up basic templates and static files                   | Infrastructure | W1.1         | Done   |
| W1.4  | Infrastructure         | Create Docker configuration for deployment                | Infrastructure | W1.1         | Done   |
| W1.5  | Web Interface          | Implement basic home page with navigation                 | Unit         | W1.3         | Done   |
| W1.6  | Web Interface          | Implement file upload form for QFX/CSV files              | Unit         | W1.5         | Done   |
| W1.7  | Integration            | Connect file upload to existing parser                    | Integration  | W1.6         | Done   |
| W1.8  | Web Interface          | Implement tax year selection form                         | Unit         | W1.5         | Done   |

## Sprint 2: Calculator Integration

| ID    | Component               | Task Description                                          | Test Type    | Dependencies | Status |
|-------|------------------------|----------------------------------------------------------|--------------|--------------|--------|
| W2.1  | Backend Service        | Create web service layer for calculator                   | Unit         | W1.1-W1.8    | Done   |
| W2.2  | Backend Service        | Implement asynchronous calculation task                   | Unit         | W2.1         | Done        |
| W2.3  | Web Interface          | Implement progress indicator for calculations             | Unit         | W2.2         | Todo   |
| W2.4  | Backend Service        | Create temporary file storage service                     | Unit         | W2.1         | Done   |
| W2.5  | Integration            | Connect calculation service to web interface              | Integration  | W2.1-W2.4    | Done   |
| W2.6  | Web Interface          | Implement calculation options form                        | Unit         | W2.5         | Done   |

## Sprint 3: Results Visualization

| ID    | Component               | Task Description                                          | Test Type    | Dependencies | Status |
|-------|------------------------|----------------------------------------------------------|--------------|--------------|--------|
| W3.1  | Web Interface          | Implement results table display                           | Unit         | W2.1-W2.6    | Done   |
| W3.2  | Web Interface          | Create data visualization for gains/losses                | Unit         | W3.1         | In Progress |
| W3.3  | Web Interface          | Implement CSV/JSON download options                       | Unit         | W3.1         | Done   |
| W3.4  | Web Interface          | Create detailed transaction view                          | Unit         | W3.1         | Done   |
| W3.5  | Integration            | Connect visualization to calculation results              | Integration  | W3.1-W3.4    | In Progress |

## Sprint 4: Security & Deployment

| ID    | Component               | Task Description                                          | Test Type    | Dependencies | Status |
|-------|------------------------|----------------------------------------------------------|--------------|--------------|--------|
| W4.1  | Security               | Implement CSRF protection                                | Unit         | W1.1-W3.5    | Done   |
| W4.2  | Security               | Secure file uploads and temporary storage                | Unit         | W4.1         | Done   |
| W4.3  | Deployment             | Configure production WSGI server                         | Infrastructure | W4.1-W4.2    | Done   |
| W4.4  | Deployment             | Set up CI/CD pipeline                                    | Infrastructure | W4.3         | Todo   |
| W4.5  | Deployment             | Create deployment documentation                          | Documentation | W4.3-W4.4    | Done   |
| W4.6  | System                 | End-to-end system testing of web application             | System       | W1.1-W4.5    | In Progress |

## Implementation Notes

### Web Framework Selection
- Using Flask for its lightweight nature and flexibility
- Celery for asynchronous task processing (calculation jobs)
- Bootstrap for responsive UI components
- Compatible with Python 3.10

### Architecture Overview
- Frontend: HTML templates with Bootstrap, minimal JavaScript for interactivity
- Backend: Flask routes and services
- Calculator Integration: Adapter pattern to integrate existing calculator
- File Handling: Secure temporary storage with automatic cleanup

### Security Considerations
- CSRF protection for all forms
- Secure file upload handling
- Temporary file storage with access controls
- Input validation and sanitization

### Deployment Strategy
- Docker container for consistent environments
- WSGI server (Gunicorn) for production
- Nginx as reverse proxy
- CI/CD pipeline for automated testing and deployment

_Last updated: 2025-06-23_

## Next Steps

1. Complete asynchronous calculation task (W2.2) using Celery for better performance
2. Add visualization of gains/losses using Chart.js (W3.2)
3. Connect visualization to calculation results (W3.5)
4. Set up CI/CD pipeline for automated deployment (W4.4)
5. Complete end-to-end system testing (W4.6)

## Bug Fixes and Improvements

| ID    | Component               | Issue Description                                       | Fix Applied                                     | Status |
|-------|------------------------|--------------------------------------------------------|------------------------------------------------|--------|
| BF1.1 | Web Interface          | Class name mismatch in calculator instantiation        | Updated CapitalGainsCalculator to CapitalGainsTaxCalculator in app.py | Done   |
| BF1.2 | Infrastructure         | Port 5000 in use by AirPlay Receiver on macOS        | Changed default port from 5000 to 5001 in run_webapp.py | Done   |
| BF1.3 | Web Interface          | RuntimeError when accessing session outside request context | Verified that has_request_context() check in cleanup_temp_files() is already implemented. Added tests to verify correct behavior. | Done   |
