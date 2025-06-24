# UK Capital Gains Tax Calculator for Stocks and Shares

This application calculates UK capital gains tax for stocks and shares based on transactions from QFX (Quicken Exchange Format) or CSV files, typically exported from trading platforms like Interactive Brokers or Sharesight.

## Overview

The UK Capital Gains Tax Calculator processes investment transactions to determine taxable gains or losses from the disposal of shares. It supports both QFX and CSV file formats, making it compatible with most trading platforms. The calculator follows HMRC rules for capital gains tax calculations, including:

1. Acquisition and disposal matching rules
2. Currency conversion for non-GBP transactions
3. Calculation of allowable costs and deductions
4. Annual exemption application

## Usage

You can use the calculator in two ways:

### 1. Traditional CLI (using positional arguments)

```bash
python -m src.main.python.cli <file_path> <tax_year> [options]

# Example with CSV file:
python -m src.main.python.cli data/trades.csv 2024-2025 --file-type csv

# Example with QFX file:
python -m src.main.python.cli data/trades.qfx 2024-2025

# Additional options:
  --file-type {qfx,csv}  Type of input file (default: qfx)
  --output OUTPUT        Output path for the report (without extension)
  --format {csv,json}    Output format for the report (default: csv)
  --verbose             Enable verbose output
```

### 2. Modern CLI (using named arguments)

```bash
python run_calculator.py --input <file_path> --tax-year <tax_year> [options]

# Example with CSV file:
python run_calculator.py --input data/trades.csv --tax-year 2024-2025

# Example with QFX file:
python run_calculator.py --input data/trades.qfx --tax-year 2024-2025

# Additional options:
  --output TEXT         Path to save the tax report (without extension)
  --format TEXT        Format of the report (csv or json)
  --verbose            Enable verbose logging
```

Both methods provide the same functionality and produce identical results. Choose the one that better fits your workflow.

## Supported Scenarios

The calculator handles the following scenarios:

### 1. Basic Share Disposals

- Buy shares and sell them later, calculating the gain or loss
- Handle multiple acquisitions and disposals of the same security
- Apply the "same-day" and "30-day" matching rules (shares bought on the same day or within 30 days after a sale)

### 2. Currency Considerations

- Convert non-GBP transactions to GBP for tax calculations
- Handle exchange rate fluctuations between purchase and sale
- Use exchange rates at the time of each transaction

### 3. Costs and Allowances

- Include purchase and selling costs (commissions, fees)
- Calculate total allowable costs for each disposal
- Apply the annual tax-free allowance (Annual Exempt Amount)

### 4. Share Pooling

- Maintain share pools for securities with multiple purchase dates
- Calculate the average purchase price for securities in a pool
- Apply "Section 104 holding" rules for matching disposals with pooled shares

### 5. Tax Year Reporting

- Generate tax reports by UK tax year (April 6 to April 5)
- Calculate total gains/losses for the tax year
- Determine if the annual exemption threshold is exceeded

### 6. Special Cases

- Handle corporate actions (stock splits, mergers)
- Bed & breakfast rules (selling and buying back within 30 days)
- Handling of different share classes and security identifiers

## Implementation Details

The calculator follows SOLID principles and includes comprehensive tests. It processes QFX files to extract transaction data, applies UK tax rules, and generates detailed reports of gains/losses.

### QFX Parser Features

The QFX parser is designed to be robust and handle various edge cases found in real-world data:

- **Missing Price Information**: When price per unit is zero or missing, the parser calculates it from the total transaction amount and quantity
- **Multiple Security Identifiers**: Handles various formats of security identifiers (ISIN, CUSIP, etc.)
- **Error Recovery**: Continues processing despite individual transaction parse failures
- **Fallback Parsing**: Uses multiple parsing strategies if the primary method fails

### CSV Parser Features

The CSV parser supports Sharesight and similar export formats:

- **Column Mapping**: Automatically maps columns from standard CSV export formats
- **Security Identifier Handling**: Supports various security identifier formats (ISIN, CUSIP, etc.)
- **Currency Conversion**: Handles multiple currencies and conversion rates
- **Error Handling**: Validates required fields and provides detailed error messages

#### Supported CSV Format

The CSV parser expects the following columns:

| Column Name | Description | Required |
|-------------|-------------|----------|
| Symbol | Security symbol or ticker | Yes |
| SecurityID | ISIN, CUSIP or other identifier | Yes |
| SecurityIDType | Type of identifier (ISIN, CUSIP, etc.) | Yes |
| TransactionType | Type of transaction (BUY, SELL) | Yes |
| TradeDate | Date of transaction (YYYY-MM-DD) | Yes |
| SettleDate | Settlement date (YYYY-MM-DD) | No |
| Quantity | Number of shares/units | Yes |
| UnitPrice | Price per share/unit | Yes |
| TotalAmount | Total transaction amount | Yes |
| Commission | Commission or fees | No |
| Currency | Transaction currency | Yes |
| CurrencyRate | Exchange rate to GBP (if not GBP) | No |

Example CSV format:
```csv
Symbol,SecurityID,SecurityIDType,TransactionType,TradeDate,SettleDate,Quantity,UnitPrice,TotalAmount,Commission,Currency,CurrencyRate
AAPL,US0378331005,ISIN,BUY,2024-01-15,2024-01-17,10,185.92,1859.20,7.95,USD,0.787
MSFT,US5949181045,ISIN,SELL,2024-03-20,2024-03-22,5,425.52,2127.60,9.99,USD,0.775
GOOGL,US02079K1079,ISIN,BUY,2024-02-10,2024-02-12,2,142.38,284.76,5.95,USD,0.792
```

You can export transaction data in this format from platforms like Sharesight, or create your own CSV file following this structure.

### Project Structure

- `src/main/python/`: Main source code
  - `models/`: Domain models for transactions, securities, etc.
  - `parsers/`: File parsers (QFX, CSV)
  - `services/`: Business logic services
  - `interfaces/`: Interfaces for dependency injection
  - `config/`: Configuration settings
  - `utils/`: Utility functions

### Design Patterns

The implementation uses:
- **Dependency Injection**: Services are injected into the calculator
- **Interface Segregation**: Clean interfaces for each responsibility
- **Strategy Pattern**: Different implementations can be swapped (e.g., report formats)
- **Factory Method**: Creating objects through interfaces

### Testing

- Unit tests for individual components
- Integration tests for the full calculation process

## Requirements

- Python 3.10+ (recommended)
- Required libraries: (listed in requirements.txt/web_requirements.txt)
- Anaconda or Miniconda (recommended for conda environment)

## Future Enhancements

- Support for additional file formats (PDF)
- Integration with HMRC self-assessment
- Multi-year tax planning tools
- Handling of other investment types (bonds, funds, etc.)
