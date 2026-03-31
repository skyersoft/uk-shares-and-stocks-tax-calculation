/**
 * TypeScript interfaces for the /timeline endpoint.
 */

export type TimelineEventType =
  | 'BUY'
  | 'SELL'
  | 'DIVIDEND'
  | 'INTEREST'
  | 'SPLIT'
  | 'YEAR_END'
  | 'CURRENT_DATE';

export interface TimelineEvent {
  event_index: number;
  /** ISO-8601 date string e.g. "2024-06-01" */
  event_date: string;
  /** UK tax year e.g. "2024-2025" */
  tax_year: string;
  label: string;
  event_type: TimelineEventType;
  symbol: string | null;
  quantity: number | null;
  /** GBP price per unit at the time of the event */
  price_gbp: number | null;
  currency: string | null;
  /** Current Yahoo market value of all open positions (GBP) */
  unrealised_value_gbp: number;
  /** unrealised_value_gbp minus total_cost_basis_gbp */
  unrealised_gain_loss_gbp: number;
  /** Running total cost basis of open positions (GBP) */
  total_cost_basis_gbp: number;
  /** Cumulative HMRC gain/loss for the current tax year (GBP) */
  realised_gain_loss_gbp: number;
  /** Estimated CGT (basic rate) on realised_gain_loss_gbp */
  realised_tax_gbp: number;
  /** Dividend + interest income for the current tax year (GBP) */
  income_gbp: number;
  /**
   * Estimated CGT if all holdings were sold at current Yahoo prices.
   * Set only on YEAR_END and CURRENT_DATE events.
   */
  predictive_sell_all_cgt_gbp: number | null;
}

export interface TimelineSummary {
  final_unrealised_value_gbp: number;
  final_unrealised_gain_loss_gbp: number;
  final_total_cost_basis_gbp: number;
  final_realised_gain_loss_gbp: number;
  final_realised_tax_gbp: number;
  final_income_gbp: number;
  predictive_cgt_gbp: number;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  summary: TimelineSummary;
}
