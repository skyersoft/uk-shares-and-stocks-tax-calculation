// Mirrors the backend JSON (snake_case) from /inspect-file.
// Sources: src/main/python/models/file_inspection.py and inspection_result.py

export type Verdict =
  | 'ready'
  | 'ready_with_warnings'
  | 'blocked'
  | 'unsupported_format'
  | 'no_trades'
  | 'unknown';

export type ColumnStatus = 'understood' | 'check' | 'ignored' | 'blocked';

export type NextActionId =
  | 'add_earlier_file'
  | 'add_opening_holdings'
  | 'show_skipped_rows'
  | 'view_export_steps'
  | 'pick_broker'
  | 'request_support'
  | 'remove_file';

export interface ColumnInfo {
  header: string;
  mapped_to: string | null;
  status: ColumnStatus;
  filled: number;
  blank: number;
  samples: string[];
  note: string | null;
}

export interface SkippedRows {
  reason: string;
  count: number;
}

export interface RowStats {
  total: number;
  usable: number;
  skipped: SkippedRows[];
}

export interface FormatInfo {
  id: string;
  name: string;
  confidence: number;
  supported: boolean;
}

export interface Summary {
  buys: number;
  sells: number;
  tickers: string[];
  currencies: string[];
  first_date: string | null; // ISO YYYY-MM-DD
  last_date: string | null;
  tax_years: string[]; // "YYYY-YYYY"
}

export interface NextAction {
  id: NextActionId;
  label: string;
}

export interface FileInspection {
  filename: string;
  format: FormatInfo | null;
  verdict: Verdict;
  columns: ColumnInfo[];
  rows: RowStats;
  summary: Summary;
  next_actions: NextAction[];
  warnings: string[];
}

export interface SellWithoutBuy {
  symbol: string;
  date: string; // YYYY-MM-DD
  quantity: string; // decimal string
  filename: string;
}

export interface Expectation {
  rule: string; // e.g. "every_sell_has_earlier_buy"
  passed: boolean;
  details: SellWithoutBuy[];
}

export interface InspectionResult {
  files: FileInspection[];
  expectations: Expectation[];
  can_continue: boolean;
  requires_acknowledgement: boolean;
}
