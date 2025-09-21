// Types for portfolio and tax calculation results
export interface Holding {
  symbol: string;
  quantity: number;
  price: number;
  market_value: number;
  average_cost?: number;
  unrealized_gain_loss?: number;
  unrealized_gain_loss_percent?: number;
}

export interface MarketSummary {
  currency: string;
  total_market_value: number;
  total_unrealized_gain_loss: number;
  total_unrealized_gain_loss_percent: number;
  holdings: Holding[];
}

export interface PortfolioAnalysis {
  market_summaries: Record<string, MarketSummary>;
  total_portfolio_value: number;
  total_unrealized_gain_loss: number;
  total_unrealized_gain_loss_percent: number;
}

export interface TaxCalculation {
  capital_gains_tax: number;
  dividend_tax: number;
  total_tax_liability: number;
  section_104_pools: Record<string, any>;
  disposal_calculations: any[];
}

export interface CalculationResult {
  portfolio_analysis: PortfolioAnalysis;
  tax_calculations: TaxCalculation;
  processed_at: string;
  input_summary: {
    file_type: string;
    total_transactions: number;
    date_range: {
      start: string;
      end: string;
    };
  };
}