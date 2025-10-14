# Standard Internal CSV Format Specification

## Overview

This document defines the standard CSV format that all broker data will be converted to. This approach simplifies the architecture by having a single, well-defined format that the tax calculation engine understands, rather than trying to support multiple broker-specific formats directly.

## Format Specification

### File Structure
- **Encoding**: UTF-8
- **Delimiter**: Comma (`,`)
- **Quote Character**: Double quote (`"`)
- **Header Row**: Required (first row)
- **Date Format**: YYYY-MM-DD (ISO 8601)
- **Decimal Separator**: Period (`.`)

### Required Columns

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `date` | string | Yes | Transaction date in YYYY-MM-DD format | `2024-01-15` |
| `symbol` | string | Yes | Stock ticker/symbol | `AAPL` |
| `name` | string | Yes | Full company/security name | `Apple Inc` |
| `quantity` | number | Yes | Number of shares (positive for buys, negative for sells) | `100` or `-50` |
| `price` | number | Yes | Price per share in transaction currency | `150.25` |
| `total_amount` | number | Yes | Total transaction amount (quantity × price) | `15025.00` |
| `currency` | string | Yes | Transaction currency code | `USD`, `GBP`, `EUR` |
| `transaction_type` | string | Yes | Type of transaction | `BUY`, `SELL`, `DIVIDEND` |
| `broker` | string | Yes | Broker/platform name | `Interactive Brokers` |
| `fees` | number | No | Transaction fees in transaction currency | `5.00` |
| `exchange_rate_to_gbp` | number | No | Currency conversion rate to GBP | `0.85` |
| `notes` | string | No | Additional transaction notes | `Market order` |

### Transaction Types

| Type | Description | Quantity Sign |
|------|-------------|---------------|
| `BUY` | Purchase of securities | Positive |
| `SELL` | Sale of securities | Negative |
| `DIVIDEND` | Dividend payment | Positive (income) |
| `FEE` | Brokerage fees/commissions | Negative (expense) |
| `TAX` | Withholding tax | Negative (expense) |
| `TRANSFER_IN` | Transfer from another broker | Positive |
| `TRANSFER_OUT` | Transfer to another broker | Negative |
| `SPLIT` | Stock split adjustment | Based on split ratio |
| `MERGER` | Corporate action adjustment | Based on exchange ratio |

### Validation Rules

1. **Date Validation**: Must be valid YYYY-MM-DD format, not in future
2. **Symbol Validation**: Non-empty, alphanumeric + special chars (., -, _)
3. **Quantity Validation**: Non-zero number
4. **Price Validation**: Positive number
5. **Currency Validation**: Valid ISO 4217 currency code
6. **Transaction Type**: Must be from approved list
7. **Amount Consistency**: `total_amount` should equal `quantity × price` (within tolerance)

### Example Data

```csv
date,symbol,name,quantity,price,total_amount,currency,transaction_type,broker,fees,exchange_rate_to_gbp,notes
2024-01-15,AAPL,Apple Inc,100,150.25,15025.00,USD,BUY,Interactive Brokers,5.00,0.85,Market order
2024-02-15,AAPL,Apple Inc,-50,155.50,-7775.00,USD,SELL,Interactive Brokers,5.00,0.82,Limit order
2024-03-01,AAPL,Apple Inc,2.50,0.00,2.50,USD,DIVIDEND,Interactive Brokers,0.00,0.82,Quarterly dividend
2024-01-15,MSFT,Microsoft Corporation,50,300.00,15000.00,USD,BUY,Fidelity,7.50,0.85,After hours
```

## Implementation Guidelines

### Converter Interface

All broker converters must implement this interface:

```python
class BrokerConverterInterface(ABC):
    @abstractmethod
    def convert_to_standard_format(self, input_file: str, broker_name: str) -> List[Dict]:
        """Convert broker-specific file to standard CSV format records."""
        pass
    
    @abstractmethod
    def get_supported_formats(self) -> List[str]:
        """Return list of supported file extensions/formats."""
        pass
    
    @abstractmethod
    def validate_broker_file(self, file_path: str) -> bool:
        """Validate that file is from the expected broker."""
        pass
```

### Error Handling

Converters should handle common issues:
- Missing or malformed columns
- Invalid date formats
- Currency conversion issues
- Negative prices or quantities where inappropriate
- Unknown transaction types

### Testing Requirements

Each converter must include:
- Unit tests with sample broker data
- Edge case handling (missing data, malformed files)
- Currency conversion accuracy tests
- Performance tests for large files

## Broker-Specific Mappings

### Interactive Brokers (Sharesight CSV)

**Key Mappings**:
- `TradeDate` → `date`
- `Symbol` → `symbol`
- `Description` → `name`
- `Quantity` → `quantity` (adjust sign for sells)
- `TradePrice` → `price`
- `TradeMoney` → `total_amount`
- Currency from `CurrencyPrimary`
- `IBCommission` → `fees`
- `FXRateToBase` → `exchange_rate_to_gbp`

**Transaction Type Mapping**:
- `ExchTrade` with positive quantity → `BUY`
- `ExchTrade` with negative quantity → `SELL`
- `Dividends` → `DIVIDEND`

### Fidelity

**Key Mappings**:
- Date column → `date`
- Symbol column → `symbol`
- Description column → `name`
- Quantity column → `quantity`
- Price column → `price`
- Amount column → `total_amount`
- Currency column → `currency`
- Action column → `transaction_type`

### Hargreaves Lansdown

**Key Mappings**:
- Date → `date`
- Ticker → `symbol`
- Name → `name`
- Quantity → `quantity`
- Price → `price`
- Value → `total_amount`
- Currency → `currency`
- Transaction type → `transaction_type`

## Benefits of Standard Format

1. **Simplified Architecture**: Single format for tax calculations
2. **Easier Testing**: Consistent data structure
3. **Better Maintainability**: Changes isolated to converters
4. **User Experience**: Clear error messages and validation
5. **Future-Proof**: Easy to add new brokers via converters

## Migration Path

1. **Phase 1**: Define format and update existing IBKR converter
2. **Phase 2**: Add converters for additional brokers
3. **Phase 3**: Update Lambda functions to use standard format
4. **Phase 4**: Add user management and data persistence
5. **Phase 5**: Enhance frontend and add portfolio features