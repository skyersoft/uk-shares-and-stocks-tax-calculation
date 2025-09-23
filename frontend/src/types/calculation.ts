// Types for portfolio and tax calculation results
export interface Holding {
  security: {
    symbol: string;
    name?: string;
    isin?: string;
  };
  quantity: number;
  current_price?: number;
  current_value_gbp: number; // The API uses current_value_gbp instead of market_value
  average_cost_gbp?: number;
  unrealized_gain_loss?: number;
  total_return_pct?: number; // The API provides this instead of unrealized_gain_loss_percent
}

export interface MarketSummary {
  currency: string;
  total_market_value: number;
  total_unrealized_gain_loss: number;
  total_unrealized_gain_loss_percent?: number; // Optional since backend doesn't provide it
  holdings: Holding[];
}

export interface PortfolioAnalysis {
  market_summaries: Record<string, MarketSummary>;
  total_portfolio_value: number;
  total_unrealized_gain_loss: number;
  total_unrealized_gain_loss_percent?: number; // Optional since backend doesn't provide it
}

export interface TaxCalculation {
  capital_gains_tax: number;
  dividend_tax: number;
  total_tax_liability: number;
  section_104_pools: Record<string, any>;
  disposal_calculations: any[];
}

export interface CalculationResult {
  file_path: string;
  tax_year: string;
  analysis_type: string;
  transaction_count: number;
  processing_time: number;
  portfolio_analysis: PortfolioAnalysis | null;
  tax_analysis: TaxCalculation | null;
  portfolio_report?: any;
  tax_report?: any;
  commission_summary?: any;
}