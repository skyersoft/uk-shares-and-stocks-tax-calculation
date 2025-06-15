# UK Capital Gains Tax Calculator for Stocks and Shares

This application calculates UK capital gains tax for stocks and shares based on transactions from QFX (Quicken Exchange Format) files, typically exported from trading platforms like Interactive Brokers.

## Overview

The UK Capital Gains Tax Calculator processes investment transactions to determine taxable gains or losses from the disposal of shares. It follows HMRC rules for capital gains tax calculations, including:

1. Acquisition and disposal matching rules
2. Currency conversion for non-GBP transactions
3. Calculation of allowable costs and deductions
4. Annual exemption application

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

## Usage

To calculate capital gains tax:

```
python run_calculator.py --input path/to/qfx_file.qfx --tax-year 2024-2025 --output report
```

Available options:
- `--input`, `-i`: Path to QFX file (required)
- `--tax-year`, `-t`: Tax year (e.g., 2024-2025) (required)
- `--output`, `-o`: Output filename without extension (default: tax_report)
- `--format`, `-f`: Output format - csv or json (default: csv)
- `--verbose`, `-v`: Enable verbose output

## Implementation Details

The calculator follows SOLID principles and includes comprehensive tests. It processes QFX files to extract transaction data, applies UK tax rules, and generates detailed reports of gains/losses.

### QFX Parser Features

The QFX parser is designed to be robust and handle various edge cases found in real-world data:

- **Missing Price Information**: When price per unit is zero or missing, the parser calculates it from the total transaction amount and quantity
- **Multiple Security Identifiers**: Handles various formats of security identifiers (ISIN, CUSIP, etc.)
- **Error Recovery**: Continues processing despite individual transaction parse failures
- **Fallback Parsing**: Uses multiple parsing strategies if the primary method fails

### Project Structure

- `src/main/python/`: Main source code
  - `models/`: Domain models for transactions, securities, etc.
  - `parsers/`: QFX file parser
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

- Python 3.8+ or Java 11+
- Required libraries: (listed in requirements.txt/pom.xml)

## Future Enhancements

- Web-based interface
- Support for additional file formats (CSV, PDF)
- Integration with HMRC self-assessment
- Multi-year tax planning tools
- Handling of other investment types (bonds, funds, etc.)
