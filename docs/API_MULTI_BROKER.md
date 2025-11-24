# API Documentation: Multi-Broker CSV Support

## Overview

The UK Capital Gains Tax Calculator API now supports automatic broker detection for CSV files. This allows users to upload CSV files from multiple brokers (Interactive Brokers, Trading 212, etc.) without manually specifying the broker type.

---

## Endpoints

### 1. Broker Detection (Preview)

**Endpoint:** `POST /prod/detect-broker`

**Purpose:** Detect the broker from an uploaded file and return metadata without performing the full tax calculation.

**Request:**
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `file` (required): The CSV/QFX file to analyze

**Response (Success - 200):**
```json
{
  "detected": true,
  "broker": "Trading 212",
  "confidence": 1.0,
  "filename": "trades.csv",
  "file_type": "csv",
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "row_count": 45
  },
  "metadata": {
    "transaction_count": 45,
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "transaction_preview": [
      {
        "date": "2024-01-15",
        "symbol": "AAPL",
        "type": "BUY",
        "quantity": 10.0,
        "price": 150.0,
        "currency": "USD"
      }
      // ... up to 5 transactions
    ]
  },
  "alternatives": [
    {
      "broker": "Interactive Brokers",
      "confidence": 0.3
    }
  ]
}
```

**Response (Broker Not Detected - 400):**
```json
{
  "detected": false,
  "error": "Could not detect broker from file. Please ensure the file is in a supported format.",
  "supported_brokers": ["Interactive Brokers", "Trading 212"]
}
```

**Response (Invalid Request - 400):**
```json
{
  "error": "Invalid request format. Expected multipart/form-data."
}
```

**Example Usage:**
```bash
curl -X POST https://your-api.com/prod/detect-broker \
  -F "file=@trades.csv"
```

```javascript
// JavaScript/TypeScript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/prod/detect-broker', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(`Detected broker: ${result.broker}`);
console.log(`Confidence: ${result.confidence * 100}%`);
```

---

### 2. Tax Calculation (Enhanced)

**Endpoint:** `POST /prod/calculate`

**Purpose:** Perform full tax calculation with automatic broker detection for CSV files.

**Request:**
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `file` (required): The CSV/QFX file containing transactions
  - `tax_year` (required): Tax year in format `YYYY-YYYY` (e.g., `2024-2025`)
  - `analysis_type` (required): Type of analysis - `capital_gains`, `income`, or `both`

**Response (Success - 200):**
```json
{
  "results": {
    "tax_analysis": {
      "capital_gains": {
        "total_gain": 5000.00,
        "total_loss": 1000.00,
        "net_gain": 4000.00,
        "taxable_gain": 1000.00,
        "annual_exemption": 3000.00
      },
      "income_tax": {
        // ... income tax details
      }
    },
    "disposal_events": [
      {
        "disposal_id": "1",
        "disposal_date": "2024-03-20",
        "security_symbol": "AAPL",
        "quantity": 5.0,
        "cost_gbp": 600.00,
        "proceeds_gbp": 800.00,
        "total_gain_loss": 200.00
      }
      // ... more disposal events
    ]
  },
  "broker_metadata": {
    "broker": "Trading 212",
    "confidence": 1.0,
    "transaction_count": 45,
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
}
```

**Response (Broker Detection Failed - 400):**
```json
{
  "error": "Broker detection failed",
  "message": "Could not detect broker from file...",
  "supported_brokers": ["Interactive Brokers", "Trading 212"]
}
```

**Response (Conversion Error - 400):**
```json
{
  "error": "Broker conversion failed",
  "message": "Invalid transaction format in row 15",
  "broker": "Trading 212"
}
```

**Example Usage:**
```bash
curl -X POST https://your-api.com/prod/calculate \
  -F "file=@trades.csv" \
  -F "tax_year=2024-2025" \
  -F "analysis_type=both"
```

```javascript
// JavaScript/TypeScript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('tax_year', '2024-2025');
formData.append('analysis_type', 'both');

const response = await fetch('/prod/calculate', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(`Broker: ${result.broker_metadata.broker}`);
console.log(`Total gain: £${result.results.tax_analysis.capital_gains.total_gain}`);
```

---

## Supported Brokers

| Broker | CSV Format | Auto-Detection | Notes |
|--------|------------|----------------|-------|
| **Interactive Brokers** | Flex Query, Sharesight | ✅ Yes | Confidence: 0.8-1.0 |
| **Trading 212** | Standard CSV Export | ✅ Yes | Confidence: 0.8-1.0 |
| **QFX Files** | Quicken Format | ✅ Yes | Legacy support |

### Adding More Brokers

The system is designed to be extensible. New brokers can be added by:
1. Creating a converter class
2. Registering it with the factory
3. No changes required to API endpoints

---

## Response Fields

### Broker Detection Response

| Field | Type | Description |
|-------|------|-------------|
| `detected` | boolean | Whether a broker was successfully detected |
| `broker` | string | Name of the detected broker |
| `confidence` | number | Confidence score (0.0-1.0) |
| `filename` | string | Original filename |
| `file_type` | string | File type (`csv`, `qfx`, `ofx`) |
| `validation.valid` | boolean | Whether file structure is valid |
| `validation.errors` | array | List of validation errors |
| `validation.warnings` | array | List of validation warnings |
| `validation.row_count` | number | Number of data rows in file |
| `metadata.transaction_count` | number | Number of transactions parsed |
| `metadata.date_range` | object | Date range of transactions |
| `metadata.transaction_preview` | array | Preview of first 5 transactions |
| `alternatives` | array | Alternative broker matches (lower confidence) |

### Broker Metadata (in calculation response)

| Field | Type | Description |
|-------|------|-------------|
| `broker` | string | Detected broker name |
| `confidence` | number | Detection confidence (0.0-1.0) |
| `transaction_count` | number | Total transactions processed |
| `date_range.start` | string | Earliest transaction date (ISO 8601) |
| `date_range.end` | string | Latest transaction date (ISO 8601) |

---

## Error Handling

### Error Response Format

All error responses follow this structure:
```json
{
  "error": "Error category",
  "message": "Detailed error message",
  // Additional context fields
}
```

### Common Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | `Broker detection failed` | Could not identify broker from file |
| 400 | `Broker conversion failed` | Error parsing transactions |
| 400 | `Invalid CSV format` | Missing required columns |
| 400 | `Invalid request format` | Wrong content type or missing parameters |
| 500 | `Internal server error` | Unexpected server error |

---

## Best Practices

### 1. File Validation Flow

Recommended workflow for robust file handling:

```javascript
// Step 1: Detect broker first
const detection = await detectBroker(file);

if (!detection.detected) {
  showError(`Unsupported file format. Supported brokers: ${detection.supported_brokers.join(', ')}`);
  return;
}

// Step 2: Show preview to user
showPreview({
  broker: detection.broker,
  confidence: detection.confidence,
  transactionCount: detection.metadata.transaction_count,
  dateRange: detection.metadata.date_range,
  preview: detection.metadata.transaction_preview
});

// Step 3: User confirms, then calculate
if (await userConfirms()) {
  const results = await calculate(file, taxYear, analysisType);
  showResults(results);
}
```

### 2. Error Handling

```javascript
try {
  const result = await detectBroker(file);
  
  if (!result.detected) {
    // Show user-friendly message
    alert(`We couldn't detect your broker. Supported formats: ${result.supported_brokers.join(', ')}`);
    return;
  }
  
  if (result.confidence < 0.8) {
    // Warn user about low confidence
    const proceed = confirm(`We detected ${result.broker} with ${result.confidence * 100}% confidence. Continue?`);
    if (!proceed) return;
  }
  
  // Proceed with calculation
  
} catch (error) {
  console.error('Detection failed:', error);
  alert('An error occurred. Please try again or contact support.');
}
```

### 3. Performance Optimization

- **Cache detection results:** Don't re-detect the same file
- **Show preview immediately:** Use `/detect-broker` for instant feedback
- **Lazy load full calculation:** Only call `/calculate` when user confirms

---

## Migration Guide

### From Legacy CSV Parser

**Before (manual broker selection):**
```javascript
const result = await calculate(file, taxYear, analysisType, broker='interactive-brokers');
```

**After (automatic detection):**
```javascript
// Detection happens automatically
const result = await calculate(file, taxYear, analysisType);

// Broker info included in response
console.log(`Processed ${result.broker_metadata.broker} file`);
```

### Backward Compatibility

- ✅ QFX files work exactly as before
- ✅ Legacy CSV format still supported
- ✅ All existing API responses unchanged (broker_metadata is additional)

---

## Rate Limits

- **Detection endpoint:** 100 requests/minute per IP
- **Calculation endpoint:** 20 requests/minute per IP

---

## Support

For issues or questions:
- **GitHub Issues:** [github.com/your-repo/issues](https://github.com)
- **Email:** support@example.com
- **Documentation:** [docs.example.com](https://docs.example.com)

---

## Changelog

### v2.0.0 (2024-11-24)
- ✨ Added multi-broker CSV support
- ✨ Added `/detect-broker` preview endpoint
- ✨ Enhanced `/calculate` with broker metadata
- ✨ Support for Trading 212 CSV files
- 🔧 Improved error messages

### v1.0.0 (2024-01-01)
- Initial release with IBKR and QFX support

