# CSV Test Samples

This directory contains CSV sample files extracted from Sharesight.csv and structured for testing the CSV parser functionality.

## Sample Files

### Basic Transaction Samples
- `basic_transactions.csv` - Sample containing various transaction types including:
  - Stock buy transactions in different currencies (EUR, GBP, USD)
  - Stock sell transactions
  - Currency exchange transactions (EUR.GBP, GBP.USD)
  - Different security types (COMMON, ETF)
  - Transactions with commission and taxes

### Specific Transaction Type Samples
- `buy_transactions.csv` - Sample containing only buy transactions for different securities
- `sell_transactions.csv` - Sample containing only sell transactions for different securities
- `mixed_transactions.csv` - Sample with a mix of buy and sell transactions for the same securities
- `currency_transactions.csv` - Sample containing only currency exchange transactions (EUR.GBP, GBP.USD)

## CSV Structure

The CSV files have the following important columns for tax calculations:

### Transaction Identification
- `TradeID` - Unique identifier for the transaction
- `TransactionType` - Type of transaction (ExchTrade)
- `Buy/Sell` - Whether the transaction is a BUY or SELL

### Security Information
- `Symbol` - Stock symbol/ticker
- `Description` - Full security name
- `SecurityID` - Unique identifier for the security
- `SecurityIDType` - Type of security identifier (ISIN, CUSIP, etc.)
- `ISIN` - International Securities Identification Number
- `AssetClass` - Type of asset (STK, CASH, etc.)
- `SubCategory` - Further classification (COMMON, ETF, etc.)

### Transaction Details
- `TradeDate` - Date of the transaction (MM/DD/YYYY format)
- `DateTime` - Timestamp of the transaction (MM/DD/YYYY;HHMMSS format)
- `Quantity` - Number of shares (positive for buys, negative for sells)
- `TradePrice` - Price per unit in transaction currency
- `TradeMoney` - Total money for the transaction
- `Proceeds` - Proceeds from the transaction (negative for buys, positive for sells)

### Currency Information
- `CurrencyPrimary` - Primary currency of the transaction (EUR, GBP, USD)
- `FXRateToBase` - Exchange rate to base currency (GBP)
- `IBCommission` - Commission charged in transaction currency
- `IBCommissionCurrency` - Currency of the commission

### Special Transactions
- `EUR.GBP` and `GBP.USD` in the Symbol column indicate currency exchange transactions

## Usage

These files should be used by test cases for the CSV parser implementation. The sample files represent real-world data scenarios and edge cases that the parser needs to handle.

## Important Notes

- **DO NOT MODIFY** these files during implementation
- Create new files for new test cases
- Use these samples for unit and integration tests of the CSV parser
- The samples are anonymized and modified for testing purposes
