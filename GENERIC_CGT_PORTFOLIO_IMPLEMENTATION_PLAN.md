# Simplified Generic CGT Tax Calculator & Portfolio Performance Monitor - Implementation Plan

## Overview

This revised implementation plan addresses the key clarifications:
- **Backend**: AWS Lambda functions (not Flask)
- **User Management**: AWS Cognito authentication required
- **Standard CSV Format**: Define one internal format, convert all broker data to it
- **Simplification**: Focus on core value - tax calculation and portfolio monitoring

## Current Architecture Analysis

### Existing Components (AWS Lambda-based)
- **Lambda Functions**: Serverless API endpoints
- **Data Processing**: Python-based tax calculation engine
- **Current CSV Parser**: Handles Sharesight format (IBKR export)
- **Frontend**: React SPA deployed to CloudFront
- **Storage**: Currently file-based, needs user-specific storage

### Key Requirements Addressed
- ✅ AWS Lambda backend (not Flask)
- ✅ User management with authentication
- ✅ Standard internal CSV format
- ✅ Simplified broker support via format conversion

## Simplified Implementation Roadmap

### Phase 1: Standard CSV Format & User Management (2-3 weeks)

#### Step 1.1: Define Standard Internal CSV Format
**Objective**: Create a unified CSV format that all broker data gets converted to.

**Standard CSV Format Specification**:
```csv
date,symbol,name,quantity,price,total_amount,currency,transaction_type,broker,fees,exchange_rate_to_gbp,notes
2024-01-15,AAPL,Apple Inc,100,150.25,15025.00,USD,BUY,Interactive Brokers,5.00,0.85,
2024-02-15,AAPL,Apple Inc,-50,155.50,-7775.00,USD,SELL,Interactive Brokers,5.00,0.82,
```

**Required Fields**:
- `date`: YYYY-MM-DD format
- `symbol`: Stock ticker/symbol
- `name`: Full company name
- `quantity`: Positive for buys, negative for sells
- `price`: Price per share in transaction currency
- `total_amount`: Total transaction amount (quantity × price)
- `currency`: Transaction currency (USD, GBP, EUR, etc.)
- `transaction_type`: BUY, SELL, DIVIDEND, etc.
- `broker`: Broker name (for tracking)
- `fees`: Transaction fees in transaction currency
- `exchange_rate_to_gbp`: Currency conversion rate to GBP
- `notes`: Optional additional information

**Implementation Tasks**:
1. Create format specification document
2. Update existing CSV parser to output this format
3. Create format validation utilities
4. Add format conversion examples

#### Step 1.2: Implement AWS Cognito User Management
**Objective**: Add user authentication and session management.

**AWS Cognito Setup**:
- User pools for authentication
- Identity pools for AWS resource access
- JWT token validation in Lambda functions

**Implementation Tasks**:
1. Create Cognito User Pool
2. Configure Lambda authorizers
3. Add user registration/login endpoints
4. Implement session management
5. Add user data isolation

**Code Changes**:
- New Lambda function: `user_management.py`
- Update existing Lambda handler with authentication
- Add user context to all API calls

#### Step 1.3: Add DynamoDB for User Data Storage
**Objective**: Replace file-based storage with user-specific database storage.

**Database Schema**:
```
users/
├── user_id (partition key)
├── email
├── portfolios/
│   ├── portfolio_id
│   ├── name
│   ├── transactions/ (as standard CSV format)
│   └── calculations/ (cached results)

calculations/
├── user_id (partition key)
├── portfolio_id (sort key)
├── tax_year
├── calculation_results
└── last_updated
```

**Implementation Tasks**:
1. Design DynamoDB tables
2. Create data access layer
3. Migrate existing file processing to database
4. Add data backup/restore functionality

### Phase 2: Broker Data Converters (3-4 weeks)

#### Step 2.1: Interactive Brokers Converter
**Objective**: Convert IBKR Sharesight CSV to standard format.

**IBKR Format Analysis**:
- Complex CSV with 80+ columns
- Multiple transaction types
- Currency conversion already included
- Commission and fees included

**Implementation Tasks**:
1. Create IBKR converter class
2. Map IBKR fields to standard format
3. Handle currency conversions
4. Add transaction type mapping
5. Comprehensive testing with real data

#### Step 2.2: Major Broker Converters
**Objective**: Add support for 4-5 major UK brokers.

**Priority Brokers**:
1. **Fidelity** - CSV export format
2. **HL (Hargreaves Lansdown)** - CSV format
3. **AJ Bell** - CSV format
4. **Vanguard** - CSV format
5. **IG Markets** - CSV format

**Implementation Tasks** (per broker):
1. Obtain sample export files
2. Analyze format and field mappings
3. Create converter class
4. Add unit tests
5. Update documentation

**Code Changes**:
- New directory: `converters/`
- Files: `ibkr_converter.py`, `fidelity_converter.py`, etc.
- Update Lambda handler to support multiple converters

#### Step 2.3: Generic CSV Converter Framework
**Objective**: Allow users to define custom mappings for unsupported brokers.

**Features**:
- CSV format detection
- Field mapping interface
- Validation and error handling
- Template-based conversion

**Implementation Tasks**:
1. Create mapping configuration system
2. Add CSV structure analysis
3. Implement flexible field mapping
4. Add validation and error reporting

### Phase 3: Enhanced Portfolio Features (4-5 weeks)

#### Step 3.1: Portfolio Performance Monitoring
**Objective**: Add comprehensive portfolio tracking and analytics.

**Performance Metrics**:
- Current portfolio value
- Total return (absolute and percentage)
- Holding period returns
- Dividend income tracking
- Realized/unrealized gains

**Implementation Tasks**:
1. Extend performance calculator for user portfolios
2. Add portfolio snapshot functionality
3. Implement performance history tracking
4. Create performance summary reports

#### Step 3.2: Market Data Integration
**Objective**: Add real-time pricing for portfolio valuation.

**Data Sources** (Simple approach):
1. **Alpha Vantage** (Free tier: 5 calls/minute, 500/day)
2. **Yahoo Finance** (Free, reliable)
3. **Cached data** with daily updates

**Implementation Tasks**:
1. Create market data service
2. Implement price caching in DynamoDB
3. Add portfolio valuation endpoints
4. Handle API rate limits and errors

#### Step 3.3: Enhanced Tax Calculations
**Objective**: Improve tax calculation accuracy and reporting.

**Enhancements**:
- Better currency handling
- Enhanced disposal matching
- More detailed tax reports
- Historical tax year comparisons

**Implementation Tasks**:
1. Update tax calculation logic
2. Add currency conversion improvements
3. Enhance reporting formats
4. Add tax optimization suggestions

### Phase 4: Frontend Updates & Testing (3-4 weeks)

#### Step 4.1: User Authentication UI
**Objective**: Add login/registration to the React frontend.

**Features**:
- User registration and login forms
- Password reset functionality
- Session management
- Protected routes

**Implementation Tasks**:
1. Add Cognito authentication components
2. Update routing for authenticated users
3. Add user profile management
4. Implement logout functionality

#### Step 4.2: Multi-Broker Upload Interface
**Objective**: Allow users to upload data from different brokers.

**Features**:
- Broker selection interface
- File upload with format validation
- Conversion status feedback
- Error handling and user guidance

**Implementation Tasks**:
1. Create broker selection component
2. Add file upload with progress indicators
3. Implement conversion status tracking
4. Add error reporting and help text

#### Step 4.3: Portfolio Dashboard
**Objective**: Create comprehensive portfolio monitoring interface.

**Dashboard Components**:
- Portfolio overview (total value, gains/losses)
- Holdings table with performance
- Performance charts
- Tax calculation results
- Recent transactions

**Implementation Tasks**:
1. Design dashboard layout
2. Implement portfolio components
3. Add real-time data updates
4. Create responsive mobile layout

#### Step 4.4: Comprehensive Testing
**Objective**: Ensure system reliability with thorough testing.

**Testing Requirements**:
- Unit tests for all converters
- Integration tests for Lambda functions
- End-to-end user workflows
- Performance and load testing

## Technical Architecture

### AWS Services Used
- **Lambda**: Serverless compute for API endpoints
- **API Gateway**: REST API management
- **Cognito**: User authentication and authorization
- **DynamoDB**: NoSQL database for user data
- **S3**: File storage for uploads and reports
- **CloudFront**: CDN for frontend delivery

### Data Flow
```
Broker CSV → Converter → Standard CSV → DynamoDB → Lambda → API Response → Frontend
```

### Security Considerations
- JWT token validation on all API calls
- User data isolation in DynamoDB
- Secure file upload handling
- API rate limiting
- Input validation and sanitization

## Implementation Timeline (12 weeks total)

### Weeks 1-3: Foundation
- ✅ Define standard CSV format
- ✅ Implement Cognito user management
- ✅ Set up DynamoDB schema
- ✅ Update Lambda functions for authentication

### Weeks 4-7: Broker Support
- ✅ Build IBKR converter
- ✅ Add 2-3 major broker converters
- ✅ Create generic converter framework
- ✅ Test all converters with real data

### Weeks 8-11: Portfolio Features
- ✅ Enhance performance monitoring
- ✅ Add market data integration
- ✅ Improve tax calculations
- ✅ Update frontend with user auth

### Weeks 12: Testing & Launch
- ✅ Comprehensive testing
- ✅ Performance optimization
- ✅ Documentation updates
- ✅ Production deployment

## Success Metrics

### Functional Goals
- ✅ Support for 5+ major brokers
- ✅ User authentication and data isolation
- ✅ Real-time portfolio valuation
- ✅ Accurate UK CGT calculations
- ✅ Standard CSV format for all broker data

### Technical Goals
- ✅ <3 second API response times
- ✅ 99.9% uptime
- ✅ Secure user data handling
- ✅ Mobile-responsive interface
- ✅ Comprehensive test coverage

## Risk Mitigation

### Technical Risks
- **API Limits**: Implement caching and fallback pricing
- **Data Accuracy**: Rigorous testing with real broker data
- **Performance**: Optimize Lambda cold starts and DynamoDB queries
- **Security**: Regular security reviews and updates

### Business Risks
- **User Adoption**: Focus on major UK brokers first
- **Regulatory Changes**: Monitor HMRC tax rule updates
- **Competition**: Differentiate with broker support and accuracy

This simplified approach focuses on the core value proposition while maintaining architectural flexibility for future enhancements.