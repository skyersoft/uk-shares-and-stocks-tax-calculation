"""CSV generator for performance testing.

This module provides utilities for generating large CSV files with 
random transactions for performance testing.
"""
import os
import random
import csv
from datetime import datetime, timedelta

# Constants for CSV generation
SECURITIES = [
    {"name": "Apple Inc.", "ticker": "AAPL", "id": "US0378331005", "id_type": "ISIN"},
    {"name": "Microsoft Corporation", "ticker": "MSFT", "id": "US5949181045", "id_type": "ISIN"},
    {"name": "Amazon.com Inc.", "ticker": "AMZN", "id": "US0231351067", "id_type": "ISIN"},
    {"name": "Alphabet Inc.", "ticker": "GOOGL", "id": "US02079K3059", "id_type": "ISIN"},
    {"name": "Meta Platforms Inc.", "ticker": "META", "id": "US30303M1027", "id_type": "ISIN"},
    {"name": "Tesla, Inc.", "ticker": "TSLA", "id": "US88160R1014", "id_type": "ISIN"},
    {"name": "NVIDIA Corporation", "ticker": "NVDA", "id": "US67066G1040", "id_type": "ISIN"},
    {"name": "Berkshire Hathaway Inc.", "ticker": "BRK.A", "id": "US0846707026", "id_type": "ISIN"},
    {"name": "JPMorgan Chase & Co.", "ticker": "JPM", "id": "US46625H1005", "id_type": "ISIN"},
    {"name": "Johnson & Johnson", "ticker": "JNJ", "id": "US4781601046", "id_type": "ISIN"},
]

# CSV headers that match the expected format by the parser
CSV_HEADERS = [
    "Buy/Sell", "TradeDate", "Symbol", "SecurityID", "SecurityIDType", 
    "Description", "Quantity", "TradePrice", "IBCommission", "Taxes",
    "CurrencyPrimary", "FXRateToBase", "TradeAmount", "BaseAmount"
]


def create_large_csv_file(num_transactions, output_dir, base_currency="GBP"):
    """Create a large CSV file with random transactions for performance testing.
    
    Args:
        num_transactions: Number of transactions to generate
        output_dir: Directory to save the file
        base_currency: Base currency for transactions
    
    Returns:
        Path to the generated CSV file
    """
    # Generate a unique filename
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    file_name = f"large_test_file_{num_transactions}_{timestamp}.csv"
    file_path = os.path.join(output_dir, file_name)
    
    # Generate random transactions
    transactions = []
    
    # Start date for transactions
    start_date = datetime(2024, 1, 1)
    
    # Keep track of buys to generate matching sells
    buys_by_security = {sec["ticker"]: [] for sec in SECURITIES}
    
    # Generate transactions with approximately 60% buys and 40% sells
    for i in range(num_transactions):
        # Generate a random date within the tax year
        days_offset = random.randint(0, 365)
        transaction_date = start_date + timedelta(days=days_offset)
        
        # Format date as MM/DD/YYYY for the parser
        trade_date = transaction_date.strftime('%m/%d/%Y')
        
        # Select a random security
        security = random.choice(SECURITIES)
        
        # Generate a random quantity
        quantity = random.randint(1, 1000)
        
        # Generate a random price
        price = round(random.uniform(10, 1000), 2)
        
        # Generate a random commission
        commission = round(random.uniform(1, 20), 2)
        
        # Set taxes
        taxes = round(random.uniform(0, 5), 2)
        
        # Set currency (USD for simplicity)
        currency = "USD"
        
        # Set FX rate
        fx_rate = round(random.uniform(0.75, 0.85), 4)  # USD to GBP
        
        # Calculate amounts
        trade_amount = round(quantity * price, 2)
        base_amount = round(trade_amount * fx_rate, 2)
        
        # Determine if buy or sell
        # More buys than sells at the beginning, then balance out
        is_buy = random.random() < 0.6 or i < num_transactions * 0.2
        
        # If we have buys for this security and want to sell
        if not is_buy and buys_by_security[security["ticker"]]:
            # Get a buy to match with
            buy_record = random.choice(buys_by_security[security["ticker"]])
            # Don't sell more than we bought
            quantity = min(quantity, buy_record["quantity"])
            # If this would completely close the position, remove it from buys
            if quantity == buy_record["quantity"]:
                buys_by_security[security["ticker"]].remove(buy_record)
            else:
                # Otherwise reduce the buy quantity
                buy_record["quantity"] -= quantity
        elif not is_buy and not buys_by_security[security["ticker"]]:
            # If we want to sell but have no matching buy, make it a buy instead
            is_buy = True
        
        # Record the buy for potential future sells
        if is_buy:
            buys_by_security[security["ticker"]].append({
                "security": security,
                "quantity": quantity,
                "price": price
            })
        
        # Create transaction record
        transaction = [
            "BUY" if is_buy else "SELL",
            trade_date,
            security["ticker"],
            security["id"],
            security["id_type"],
            security["name"],
            str(quantity),
            str(price),
            str(commission),
            str(taxes),
            currency,
            str(fx_rate),
            str(trade_amount),
            str(base_amount)
        ]
        
        transactions.append(transaction)
    
    # Write transactions to CSV file
    with open(file_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(CSV_HEADERS)
        writer.writerows(transactions)
    
    return file_path
