# 🏛️ Architecture Overview

System architecture and design decisions for the IBKR Tax Calculator.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              CloudFront CDN (E3CPZK9XL7GR6Q)                │
│  - SSL/TLS Termination                                       │
│  - Content Security Policy Headers                           │
│  - Caching (static assets)                                   │
└────────┬──────────────────────────────────┬─────────────────┘
         │                                  │
         │ Static Assets                    │ API Requests
         ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────────┐
│   S3 Bucket          │         │   API Gateway            │
│   (React SPA)        │         │   (d1tr8kb7oh)           │
│                      │         │   - CORS                 │
│   - index.html       │         │   - Request validation   │
│   - JS/CSS bundles   │         │   - Rate limiting        │
│   - Assets           │         └────────┬─────────────────┘
└──────────────────────┘                  │
                                          ▼
                               ┌──────────────────────────┐
                               │   Lambda Function        │
                               │   (Python 3.10)          │
                               │                          │
                               │   - Parse QFX/CSV        │
                               │   - Calculate CGT        │
                               │   - Generate reports     │
                               └──────────────────────────┘
```

### Infrastructure Components

#### Frontend Layer
- **React SPA**: Single-page application built with Vite
- **S3 Hosting**: Static website hosting
- **CloudFront**: Global CDN with edge caching
- **Route 53**: DNS management for cgttaxtool.uk
- **ACM**: SSL/TLS certificate

#### Backend Layer
- **API Gateway**: RESTful API endpoint
- **Lambda Function**: Serverless compute (1024MB, 30s timeout)
- **CloudWatch**: Logging and monitoring

#### Infrastructure as Code
- **Terraform**: All infrastructure defined as code
- **State Management**: S3 backend for Terraform state

## Application Architecture

### Frontend Architecture (React SPA)

```
frontend/
├── src/
│   ├── components/
│   │   ├── calculator/          # Multi-step calculator wizard
│   │   │   ├── MultiStepCalculator.tsx
│   │   │   └── steps/           # Individual wizard steps
│   │   ├── results/             # Results display components
│   │   │   ├── HoldingsTable.tsx
│   │   │   ├── ResultsDisposalsTable.tsx
│   │   │   └── ResultsDividendsTable.tsx
│   │   └── ui/                  # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Table.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── CalculatorPage.tsx
│   │   └── ResultsPage.tsx
│   ├── services/
│   │   └── api.ts               # API client
│   └── types/
│       └── calculation.ts       # TypeScript types
└── public/
    ├── favicon.ico
    └── ads.txt
```

**Key Patterns**:
- **Component Composition**: Small, focused components
- **React Router**: Hash-based routing (`/#/calculator`, `/#/results`)
- **State Management**: React hooks (useState, useEffect)
- **API Communication**: Fetch API with FormData for file uploads
- **Type Safety**: TypeScript strict mode

### Backend Architecture (Python Lambda)

```
src/main/python/
├── models/                   # Data models (Pydantic)
│   ├── transaction.py
│   ├── holding.py
│   └── tax_report.py
├── parsers/                  # File parsers
│   ├── qfx_parser.py        # QFX/OFX format
│   └── csv_parser.py        # CSV format
├── services/                 # Business logic
│   ├── tax_calculator.py    # CGT calculations
│   ├── portfolio_analyzer.py
│   └── report_generator.py
├── interfaces/               # Abstractions
│   ├── parser_interface.py
│   └── calculator_interface.py
├── config/                   # Configuration
│   └── tax_rules.py         # HMRC tax rules
└── utils/                    # Utilities
    ├── currency_converter.py
    └── date_utils.py
```

**Design Principles**:
- **SOLID Principles**: Single responsibility, dependency injection
- **Strategy Pattern**: Tax calculation strategies for different scenarios
- **Factory Pattern**: Parser selection based on file type
- **Interface Segregation**: Clear contracts between layers

### Data Flow

#### Calculation Request Flow

```
1. User uploads QFX/CSV file via React SPA
   ↓
2. Frontend sends multipart/form-data POST to API Gateway
   ↓
3. API Gateway invokes Lambda function
   ↓
4. Lambda handler:
   a. Receives file and parameters
   b. Detects file format (QFX vs CSV)
   c. Instantiates appropriate parser
   d. Parses transactions
   e. Runs tax calculations
   f. Generates report
   ↓
5. Lambda returns JSON response
   ↓
6. Frontend displays results in tables/charts
```

#### API Request/Response

**Request**:
```http
POST /prod/calculate
Content-Type: multipart/form-data

file: <binary QFX/CSV file>
tax_year: "2024-2025"
analysis_type: "both"
```

**Response**:
```json
{
  "tax_year": "2024-2025",
  "transaction_count": 20,
  "processing_time": 0.037,
  "tax_analysis": {
    "capital_gains": {
      "disposals": [...],
      "total_gains": 0.0,
      "total_losses": -44.59,
      "taxable_gain": 0
    },
    "dividend_income": {...}
  },
  "portfolio_analysis": {
    "holdings": [...]
  }
}
```

## Tax Calculation Engine

### HMRC Rules Implementation

**Section 104 Pooling**:
- Maintains running average cost for each security
- Handles same-day and bed-and-breakfast rules
- Calculates allowable costs

**Capital Gains Tax**:
- Annual exemption: £3,000 (2024-2025)
- Tax rates: 10% (basic), 20% (higher)
- Loss carry-forward support

**Dividend Tax**:
- Dividend allowance: £500 (2024-2025)
- Tax rates: 8.75% (basic), 33.75% (higher), 39.35% (additional)

### Calculation Algorithm

```python
1. Parse transactions from file
2. Group by security (symbol)
3. For each disposal:
   a. Identify matching acquisitions (same-day, 30-day, Section 104)
   b. Calculate cost basis
   c. Calculate gain/loss
   d. Apply allowable expenses
4. Sum total gains/losses
5. Apply annual exemption
6. Calculate tax liability
```

## Security Architecture

### Content Security Policy

Strict CSP headers prevent XSS attacks:
- `default-src 'self'` - Only load resources from same origin
- `script-src` - Allow specific CDNs and inline scripts
- `connect-src` - Restrict API calls to known endpoints
- `frame-src` - Control iframe sources

### Data Protection

- **No Persistence**: Files processed in-memory only
- **Temporary Storage**: Lambda /tmp cleared after execution
- **HTTPS Only**: All communications encrypted
- **CORS**: Restricted to known origins

### IAM Security

- **Lambda Execution Role**: Minimal permissions (logs only)
- **S3 Bucket Policy**: CloudFront access only
- **API Gateway**: Resource policies for access control

## Performance Considerations

### Frontend Optimization

- **Code Splitting**: Lazy load routes
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Minified JS/CSS, compressed images
- **CDN Caching**: Static assets cached at edge locations

### Backend Optimization

- **Lambda Memory**: 1024MB for optimal CPU allocation
- **Cold Start**: ~500ms (acceptable for user-initiated requests)
- **Execution Time**: Typically 20-100ms for calculations
- **Concurrency**: Auto-scaling to handle traffic spikes

## Monitoring & Observability

### Metrics

- **Lambda**: Invocations, duration, errors, throttles
- **API Gateway**: Request count, latency, 4xx/5xx errors
- **CloudFront**: Cache hit ratio, bandwidth

### Logging

- **Lambda Logs**: CloudWatch Logs with structured logging
- **API Gateway Logs**: Access logs for debugging
- **Error Tracking**: CloudWatch alarms for error rates

## Scalability

### Current Limits

- **Lambda Concurrency**: 1000 (AWS account limit)
- **API Gateway**: 10,000 requests/second
- **S3**: Unlimited requests
- **CloudFront**: Global scale

### Future Scaling Considerations

- **Database**: Add DynamoDB for user accounts/history
- **Caching**: Redis/ElastiCache for frequent calculations
- **Queue**: SQS for async processing of large files
- **Multi-Region**: Deploy to multiple AWS regions

## Technology Decisions

### Why Serverless?

✅ **Pros**:
- Zero server management
- Auto-scaling
- Pay-per-use pricing
- High availability

❌ **Cons**:
- Cold start latency
- Execution time limits (15 min max)
- Vendor lock-in

### Why React SPA?

✅ **Pros**:
- Rich user experience
- Component reusability
- Large ecosystem
- TypeScript support

### Why Terraform?

✅ **Pros**:
- Infrastructure as code
- Version control
- State management
- Multi-cloud support

---

*Last Updated: 2025-11-20*
