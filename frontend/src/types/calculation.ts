// Types for portfolio and tax calculation results
export interface Holding {
  security?: {
    symbol: string;
    name?: string;
    isin?: string;
  };
  // Direct properties for test compatibility
  symbol?: string;
  name?: string;
  quantity: number;
  price?: number;
  current_price?: number;
  market_value?: number; // Test data uses market_value
  current_value_gbp: number; // The API uses current_value_gbp instead of market_value
  average_cost?: number; // Test data uses average_cost
  average_cost_gbp?: number;
  unrealized_gain_loss?: number;
  unrealized_gain_loss_percent?: number; // Test data uses this
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
  additional_income?: {
    otherIncome: number;
    otherDividends: number;
    otherCapitalGains: number;
  };
}

export interface CurrencyBalance {
  currency: string;
  balance: number;
  balance_gbp: number;
  fx_rate: number;
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
  disposal_events?: DisposalEvent[];
  currency_balances?: CurrencyBalance[];
}

export interface DisposalEvent {
  disposal_id: string;
  disposal_date: string;
  security_symbol: string;
  security_name: string;
  security_country: string | null;
  quantity: number;
  
  // Cost breakdown
  cost_original_amount: number;
  cost_original_currency: string;
  cost_fx_rate: number;
  cost_gbp: number;
  cost_commission: number;
  acquisition_date: string | null;
  
  // Proceeds breakdown
  proceeds_original_amount: number;
  proceeds_original_currency: string;
  proceeds_fx_rate: number;
  proceeds_gbp: number;
  proceeds_commission: number;
  
  // Tax and FX tracking
  withholding_tax: number;
  fx_gain_loss: number;
  cgt_gain_loss: number;
  total_gain_loss: number;
  matching_rule: 'same-day' | 'bed-breakfast' | 'section104';
  
  // Calculated properties
  allowable_cost: number;
  net_proceeds: number;
}

export interface CSVValidationError {
  error: string;
  message: string;
  missing_columns: string[];
  required_columns: string[];
}

export interface NormalizedDisposal {
  disposalDate: string;
  symbol: string;
  quantity: number;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  raw?: any;
}

export interface NormalizedDividend {
  paymentDate: string;
  symbol: string;
  name?: string;
  grossAmount: number;
  withholdingTax: number;
  netAmount: number;
  raw?: any;
}

export interface NormalizedHolding {
  symbol: string;
  name?: string;
  quantity: number;
  averageCostGBP: number;
  currentValueGBP: number;
  totalCostGBP: number;
  unrealizedGainLoss: number;
  returnPct: number;
  currency?: string;
  raw?: any;
}

export interface ResultsMetrics {
  totalTaxLiability: number;
  portfolioValue: number;
  totalReturnPercent: number;
}

export interface NormalizedResults {
  taxYear: string | null;
  metrics: ResultsMetrics;
  disposals: NormalizedDisposal[];
  dividends: NormalizedDividend[];
  holdings: NormalizedHolding[];
  counts: {
    disposals: number;
    dividends: number;
    holdings: number;
  };
  showCgtWarning: boolean;
  portfolioAnalysis: PortfolioAnalysis | null;
  taxAnalysis: any;
  taxReport: any;
  portfolioReport: any;
}

// ---------------------------------------------------------------------------
// Unrealised Gains / Predictive CGT
// ---------------------------------------------------------------------------

export interface UnrealisedPosition {
  symbol: string;
  name: string;
  quantity: number;
  market: string;
  price_currency: string;
  current_price_native: number;
  current_price_gbp: number;
  fx_rate_to_gbp: number;
  current_value_gbp: number;
  cost_basis_gbp: number;
  unrealised_gain_loss_gbp: number;
  gain_loss_pct: number;
  has_recent_buys: boolean;
  days_since_last_buy: number | null;
  price_source: string;
  price_fetched_at: string | null;
}

export interface UnrealisedGainsPortfolio {
  total_current_value_gbp: number;
  total_cost_basis_gbp: number;
  total_unrealised_gain_loss_gbp: number;
  number_of_positions: number;
}

export interface PredictiveCgt {
  total_gains_gbp: number;
  total_losses_gbp: number;
  net_gain_gbp: number;
  annual_exemption_available_gbp: number;
  taxable_gain_gbp: number;
  estimated_tax_basic_rate_gbp: number;
  estimated_tax_higher_rate_gbp: number;
}

export interface CombinedWithRealised {
  already_realised_gain_gbp: number;
  combined_net_gain_gbp: number;
  combined_taxable_gain_gbp: number;
  estimated_tax_basic_rate_gbp: number;
  estimated_tax_higher_rate_gbp: number;
}

export interface UnrealisedGainsResult {
  tax_year: string;
  hypothetical_sale_date: string | null;
  portfolio: UnrealisedGainsPortfolio;
  predictive_cgt: PredictiveCgt;
  combined_with_realised: CombinedWithRealised;
  warnings: {
    affected_by_bb_rule: boolean;
    bb_rule_affected_symbols: string[];
  };
  price_fetched_at: string | null;
  positions: UnrealisedPosition[];
  broker_file: string;
}
