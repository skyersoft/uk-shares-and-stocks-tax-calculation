"""QFX file generator for performance testing.

This module creates synthetic QFX files with configurable numbers of transactions
to test system performance with large datasets.
"""
import os
import tempfile
from datetime import datetime, timedelta
import random
from typing import List, Tuple


class QfxGenerator:
    """Generator for synthetic QFX files with configurable transaction counts."""
    
    def __init__(self):
        """Initialize the QFX generator."""
        self.securities = [
            ("JE00B1VS3770", "ISIN", "VS3770"),  # VANGUARD S&P 500
            ("KYG393871085", "ISIN", "871085"),  # TENCENT HOLDINGS
            ("US0378331005", "ISIN", "AAPL"),    # APPLE INC
            ("US5949181045", "ISIN", "MSFT"),    # MICROSOFT CORP
            ("US02079K3059", "ISIN", "GOOGL"),   # ALPHABET INC
            ("US0231351067", "ISIN", "AMZN"),    # AMAZON.COM INC
            ("US88160R1014", "ISIN", "TSLA"),    # TESLA INC
            ("US6174464486", "ISIN", "META"),    # META PLATFORMS
            ("US67066G1040", "ISIN", "NVDA"),    # NVIDIA CORP
            ("US30303M1027", "ISIN", "META"),    # META PLATFORMS
        ]
        
        self.base_date = datetime(2024, 1, 1)
    
    def generate_qfx_file(self, num_transactions: int, output_path: str) -> str:
        """Generate a QFX file with specified number of transactions.
        
        Args:
            num_transactions: Number of transactions to generate
            output_path: Path where to save the QFX file
            
        Returns:
            Path to the generated QFX file
        """
        transactions = self._generate_transactions(num_transactions)
        qfx_content = self._create_qfx_content(transactions)
        
        with open(output_path, 'w', encoding='latin-1') as f:
            f.write(qfx_content)
        
        return output_path
    
    def _generate_transactions(self, count: int) -> List[Tuple]:
        """Generate transaction data.
        
        Args:
            count: Number of transactions to generate
            
        Returns:
            List of transaction tuples
        """
        transactions = []
        
        for i in range(count):
            # Alternate between buy and sell
            is_buy = i % 2 == 0
            
            # Random security
            security = random.choice(self.securities)
            
            # Random date within 2024
            days_offset = random.randint(0, 365)
            trade_date = self.base_date + timedelta(days=days_offset)
            
            # Random transaction values
            quantity = random.randint(10, 1000)
            price = round(random.uniform(10.0, 500.0), 2)
            commission = round(random.uniform(0.5, 15.0), 2)
            
            transactions.append({
                'id': f'TXN{i+1:06d}',
                'type': 'BUY' if is_buy else 'SELL',
                'date': trade_date,
                'security_id': security[0],
                'security_type': security[1],
                'symbol': security[2],
                'quantity': quantity if is_buy else -quantity,
                'price': price,
                'commission': commission,
                'total': (quantity * price) + (commission if is_buy else -commission)
            })
        
        return transactions
    
    def _create_qfx_content(self, transactions: List[Tuple]) -> str:
        """Create QFX file content from transaction data.
        
        Args:
            transactions: List of transaction data
            
        Returns:
            QFX file content as string
        """
        header = """OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
	<SIGNONMSGSRSV1>
		<SONRS>
			<STATUS>
				<CODE>0</CODE>
				<SEVERITY>INFO</SEVERITY>
			</STATUS>
			<DTSERVER>20241201120000</DTSERVER>
			<LANGUAGE>ENG</LANGUAGE>
		</SONRS>
	</SIGNONMSGSRSV1>
	<INVSTMTMSGSRSV1>
		<INVSTMTTRNRS>
			<TRNUID>1</TRNUID>
			<STATUS>
				<CODE>0</CODE>
				<SEVERITY>INFO</SEVERITY>
			</STATUS>
			<INVSTMTRS>
				<INVACCTFROM>
					<BROKERID>IBKR</BROKERID>
					<ACCTID>U11075163</ACCTID>
				</INVACCTFROM>
				<INVTRANLIST>
					<DTSTART>20240101120000</DTSTART>
					<DTEND>20241231120000</DTEND>
"""
        
        footer = """</INVTRANLIST>
</INVSTMTRS>
</INVSTMTTRNRS>
</INVSTMTMSGSRSV1>
</OFX>
"""
        
        # Generate transaction XML
        transaction_xml = ""
        for tx in transactions:
            if tx['type'] == 'BUY':
                transaction_xml += self._create_buy_transaction_xml(tx)
            else:
                transaction_xml += self._create_sell_transaction_xml(tx)
        
        return header + transaction_xml + footer
    
    def _create_buy_transaction_xml(self, tx: dict) -> str:
        """Create XML for a buy transaction."""
        date_str = tx['date'].strftime('%Y%m%d%H%M%S')
        
        return f"""					<BUYSTOCK>
						<INVBUY>
							<INVTRAN>
								<FITID>{tx['id']}</FITID>
								<DTTRADE>{date_str}</DTTRADE>
							</INVTRAN>
							<SECID>
								<UNIQUEID>{tx['security_id']}</UNIQUEID>
								<UNIQUEIDTYPE>{tx['security_type']}</UNIQUEIDTYPE>
							</SECID>
							<UNITS>{abs(tx['quantity'])}</UNITS>
							<UNITPRICE>{tx['price']}</UNITPRICE>
							<COMMISSION>{tx['commission']}</COMMISSION>
							<TOTAL>{tx['total']}</TOTAL>
							<CURRENCY>
								<CURRATE>1.0</CURRATE>
								<CURSYM>GBP</CURSYM>
							</CURRENCY>
							<SUBACCTSEC>CASH</SUBACCTSEC>
							<SUBACCTFUND>CASH</SUBACCTFUND>
						</INVBUY>
						<BUYTYPE>BUY</BUYTYPE>
					</BUYSTOCK>
"""
    
    def _create_sell_transaction_xml(self, tx: dict) -> str:
        """Create XML for a sell transaction."""
        date_str = tx['date'].strftime('%Y%m%d%H%M%S')
        
        return f"""					<SELLSTOCK>
						<INVSELL>
							<INVTRAN>
								<FITID>{tx['id']}</FITID>
								<DTTRADE>{date_str}</DTTRADE>
							</INVTRAN>
							<SECID>
								<UNIQUEID>{tx['security_id']}</UNIQUEID>
								<UNIQUEIDTYPE>{tx['security_type']}</UNIQUEIDTYPE>
							</SECID>
							<UNITS>-{abs(tx['quantity'])}</UNITS>
							<UNITPRICE>{tx['price']}</UNITPRICE>
							<COMMISSION>{tx['commission']}</COMMISSION>
							<TOTAL>{abs(tx['total'])}</TOTAL>
							<CURRENCY>
								<CURRATE>1.0</CURRATE>
								<CURSYM>GBP</CURSYM>
							</CURRENCY>
							<SUBACCTSEC>CASH</SUBACCTSEC>
							<SUBACCTFUND>CASH</SUBACCTFUND>
						</INVSELL>
						<SELLTYPE>SELL</SELLTYPE>
					</SELLSTOCK>
"""


def create_large_qfx_file(num_transactions: int, temp_dir: str = None) -> str:
    """Convenience function to create a large QFX file.
    
    Args:
        num_transactions: Number of transactions to generate
        temp_dir: Directory to create file in (uses temp if None)
        
    Returns:
        Path to the generated QFX file
    """
    if temp_dir is None:
        temp_dir = tempfile.gettempdir()
    
    filename = f"large_test_{num_transactions}_transactions.qfx"
    output_path = os.path.join(temp_dir, filename)
    
    generator = QfxGenerator()
    return generator.generate_qfx_file(num_transactions, output_path)


if __name__ == "__main__":
    # Example usage
    generator = QfxGenerator()
    
    # Create test files with different sizes
    sizes = [100, 500, 1000]
    
    for size in sizes:
        filename = f"test_{size}_transactions.qfx"
        print(f"Generating {filename} with {size} transactions...")
        generator.generate_qfx_file(size, filename)
        print(f"Generated {filename} ({os.path.getsize(filename)} bytes)")
