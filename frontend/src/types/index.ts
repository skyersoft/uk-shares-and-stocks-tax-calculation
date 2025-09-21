// Global type definitions for the CGT Tax Calculator application

import { ReactNode } from 'react';

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Child components */
  children?: ReactNode;
  /** Test ID for component testing */
  'data-testid'?: string;
}

export interface NavigationItem {
  /** Path/URL for the navigation item */
  path: string;
  /** Display label for the navigation item */
  label: string;
  /** Whether this item is currently active */
  active?: boolean;
  /** Optional icon for the navigation item */
  icon?: string;
}

export interface FooterLink {
  /** Path/URL for the footer link */
  path: string;
  /** Display label for the footer link */
  label: string;
  /** Whether to open in new tab */
  external?: boolean;
}

// =============================================================================
// LAYOUT TYPES
// =============================================================================

export interface AppLayoutProps extends BaseComponentProps {
  /** Current page path for navigation highlighting */
  currentPath?: string;
  /** Whether to show loading state */
  isLoading?: boolean;
  /** Page title for SEO */
  title?: string;
  /** Meta description for SEO */
  description?: string;
}

// =============================================================================
// FINANCIAL DATA TYPES
// =============================================================================

export interface Currency {
  /** ISO 4217 currency code */
  code: 'GBP' | 'USD' | 'EUR';
  /** Currency symbol */
  symbol: string;
  /** Display name */
  name: string;
}

export interface MonetaryAmount {
  /** Numeric value */
  value: number;
  /** Currency information */
  currency: Currency;
  /** Formatted display string */
  formatted: string;
}

export interface Transaction {
  /** Unique transaction identifier */
  id: string;
  /** Transaction type */
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT' | 'SPIN_OFF';
  /** Security symbol/ticker */
  symbol: string;
  /** Security name */
  securityName: string;
  /** Transaction date */
  date: Date;
  /** Number of shares */
  quantity: number;
  /** Price per share */
  price: MonetaryAmount;
  /** Total transaction value */
  totalValue: MonetaryAmount;
  /** Transaction fees */
  fees?: MonetaryAmount;
  /** Exchange rate (if foreign currency) */
  exchangeRate?: number;
  /** Source of data (e.g., 'Sharesight', 'Manual') */
  source: string;
}

export interface Holding {
  /** Security symbol/ticker */
  symbol: string;
  /** Security name */
  securityName: string;
  /** Current quantity held */
  quantity: number;
  /** Average cost basis per share */
  averageCostBasis: MonetaryAmount;
  /** Total cost basis */
  totalCostBasis: MonetaryAmount;
  /** Current market value */
  currentValue?: MonetaryAmount;
  /** Unrealized gain/loss */
  unrealizedGainLoss?: MonetaryAmount;
  /** Related transactions */
  transactions: Transaction[];
}

export interface CGTCalculation {
  /** Tax year for the calculation */
  taxYear: string;
  /** Total capital gains */
  totalGains: MonetaryAmount;
  /** Total capital losses */
  totalLosses: MonetaryAmount;
  /** Net capital gain/loss */
  netGainLoss: MonetaryAmount;
  /** Annual exempt amount */
  annualExemptAmount: MonetaryAmount;
  /** Taxable gain after exemption */
  taxableGain: MonetaryAmount;
  /** CGT liability */
  cgtLiability: MonetaryAmount;
  /** Breakdown by security */
  securityBreakdown: SecurityCGTBreakdown[];
}

export interface SecurityCGTBreakdown {
  /** Security symbol/ticker */
  symbol: string;
  /** Security name */
  securityName: string;
  /** Realized gains for this security */
  realizedGains: MonetaryAmount;
  /** Realized losses for this security */
  realizedLosses: MonetaryAmount;
  /** Net gain/loss for this security */
  netGainLoss: MonetaryAmount;
  /** Disposal events */
  disposals: DisposalEvent[];
}

export interface DisposalEvent {
  /** Disposal date */
  date: Date;
  /** Quantity disposed */
  quantity: number;
  /** Disposal proceeds */
  proceeds: MonetaryAmount;
  /** Cost basis of disposed shares */
  costBasis: MonetaryAmount;
  /** Gain/loss on disposal */
  gainLoss: MonetaryAmount;
  /** Matching rule applied (Section 104, etc.) */
  matchingRule: string;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface ApiResponse<TData = unknown> {
  /** Response data */
  data: TData;
  /** Success status */
  success: boolean;
  /** Error message if any */
  message?: string;
  /** Timestamp of response */
  timestamp: string;
}

export interface ApiError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** HTTP status code */
  statusCode: number;
}

export interface FileUploadResponse {
  /** Uploaded file ID */
  fileId: string;
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Number of transactions parsed */
  transactionCount: number;
  /** Upload timestamp */
  uploadedAt: string;
}

export interface CalculationRequest {
  /** File ID from upload */
  fileId: string;
  /** Tax year for calculation */
  taxYear: string;
  /** Additional calculation options */
  options?: {
    /** Include unrealized gains in summary */
    includeUnrealized?: boolean;
    /** Currency for reporting */
    reportingCurrency?: Currency['code'];
  };
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface FormFieldProps extends BaseComponentProps {
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Current value */
  value: string | number | boolean;
  /** Change handler */
  onChange: (value: string | number | boolean) => void;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Placeholder text */
  placeholder?: string;
}

export interface ButtonProps extends BaseComponentProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Click handler */
  onClick?: () => void;
}

// =============================================================================
// STATE MANAGEMENT TYPES
// =============================================================================

export interface AppState {
  /** Current user session */
  user: User | null;
  /** Current calculation data */
  calculation: CGTCalculation | null;
  /** UI state */
  ui: UIState;
  /** Application settings */
  settings: AppSettings;
}

export interface User {
  /** User ID */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** User preferences */
  preferences: UserPreferences;
}

export interface UserPreferences {
  /** Preferred currency */
  currency: Currency['code'];
  /** Date format preference */
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto';
}

export interface UIState {
  /** Whether app is loading */
  isLoading: boolean;
  /** Current error message */
  error: string | null;
  /** Success message */
  successMessage: string | null;
  /** Current modal state */
  modal: {
    isOpen: boolean;
    type: string | null;
    data: unknown;
  };
}

export interface AppSettings {
  /** API base URL */
  apiBaseUrl: string;
  /** Feature flags */
  features: {
    enableAdvancedCalculations: boolean;
    enableReports: boolean;
    enableBlogFeatures: boolean;
  };
  /** Third-party integrations */
  integrations: {
    googleAds: {
      enabled: boolean;
      publisherId: string;
    };
    analytics: {
      enabled: boolean;
      trackingId: string;
    };
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = string> {
  key: T;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterConfig {
  [key: string]: string | number | boolean | Date | null;
}

// =============================================================================
// ENVIRONMENT TYPES
// =============================================================================

export interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_ADS_PUBLISHER_ID: string;
  readonly VITE_GA_TRACKING_ID: string;
  readonly VITE_APP_VERSION: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}