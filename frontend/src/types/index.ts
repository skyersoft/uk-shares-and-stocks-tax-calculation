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

// This interface was moved to UI Component Types section below

// Button types moved to UI Component Types section below

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
// UI COMPONENT TYPES
// =============================================================================

// Button Component Types
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' | 'outline-primary' | 'outline-secondary' | 'outline-danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends BaseComponentProps {
  /** Button variant for styling */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Icon to display in button */
  icon?: string;
  /** Whether to show icon before or after text */
  iconPosition?: 'left' | 'right';
}

// Form Component Types
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Field label */
  label?: string;
  /** Field id - will be auto-generated if not provided */
  id?: string;
  /** Error message to display */
  error?: string;
  /** Whether field is required */
  required?: boolean;
  /** Help text for the field */
  helpText?: string;
  /** Child form elements */
  children: React.ReactNode;
  /** Custom CSS class */
  className?: string;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  /** Input size for Bootstrap styling */
  size?: ButtonSize;
  /** Validation state - true for valid, false for invalid, undefined for neutral */
  isValid?: boolean;
  /** Custom CSS class */
  className?: string;
}

export interface SelectOption {
  /** Option value */
  value: string | number;
  /** Option label */
  label: string;
  /** Whether option is disabled */
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select options */
  options: SelectOption[];
  /** Select size for Bootstrap styling */
  size?: ButtonSize;
  /** Validation state - true for valid, false for invalid, undefined for neutral */
  isValid?: boolean;
  /** Placeholder text for empty option */
  placeholder?: string;
  /** Custom CSS class */
  className?: string;
}

// File Upload Component Types
export interface FileUploadProps extends BaseComponentProps {
  /** Accepted file types */
  accept?: string;
  /** Whether multiple files are allowed */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** File selection handler */
  onFilesSelected: (files: File[]) => void;
  /** Whether drag and drop is enabled */
  dragAndDrop?: boolean;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Upload progress (0-100) */
  progress?: number;
}

// Feedback Component Types
export type AlertVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alert variant */
  variant?: AlertVariant;
  /** Alert title */
  title?: string;
  /** FontAwesome icon class (e.g., "fa-info-circle") */
  icon?: string;
  /** Whether alert can be dismissed */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Alert content */
  children?: React.ReactNode;
  /** Custom CSS class */
  className?: string;
}

// Loading Spinner Component Types
export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerVariant = 'border' | 'grow';
export type SpinnerColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spinner size */
  size?: SpinnerSize;
  /** Spinner variant */
  variant?: SpinnerVariant;
  /** Spinner color */
  color?: SpinnerColor;
  /** Screen reader text */
  text?: string;
  /** Visible label text */
  label?: string;
  /** Center the spinner */
  centered?: boolean;
  /** Display spinner inline */
  inline?: boolean;
}

// Toast Notification Component Types
export type ToastVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
export type ToastPosition = 
  | 'top-start' 
  | 'top-center' 
  | 'top-end' 
  | 'middle-start' 
  | 'middle-center' 
  | 'middle-end' 
  | 'bottom-start' 
  | 'bottom-center' 
  | 'bottom-end';

export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Toast title */
  title?: string;
  /** Toast message content */
  message: string;
  /** Toast variant/type */
  variant?: ToastVariant;
  /** FontAwesome icon class */
  icon?: string;
  /** Auto dismiss timeout in ms (0 = no auto dismiss) */
  autoHide?: number;
  /** Show timestamp */
  showTimestamp?: boolean;
  /** Additional data for the toast */
  data?: any;
}

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Toast configuration */
  toast: Toast;
  /** Dismiss handler */
  onDismiss: (id: string) => void;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Show close button */
  showCloseButton?: boolean;
}

export interface ToastContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of toasts to display */
  toasts: Toast[];
  /** Toast position on screen */
  position?: ToastPosition;
  /** Maximum number of toasts to show */
  maxToasts?: number;
  /** Default auto hide duration */
  defaultAutoHide?: number;
  /** Animation duration for show/hide */
  animationDuration?: number;
  /** Show close button on toasts */
  showCloseButton?: boolean;
  /** Z-index for positioning */
  zIndex?: number;
  /** Dismiss handler */
  onDismiss: (id: string) => void;
}

export interface ToastContextType {
  /** Array of active toasts */
  toasts: Toast[];
  /** Add a new toast */
  addToast: (message: string, variant?: ToastVariant, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Remove all toasts */
  clearToasts: () => void;
  /** Show success toast */
  showSuccess: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
  /** Show error toast */
  showError: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
  /** Show warning toast */
  showWarning: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
  /** Show info toast */
  showInfo: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
}

// MODAL COMPONENT TYPES
// =============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps extends BaseComponentProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function called when modal should close */
  onClose?: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: ModalSize;
  /** Whether modal can be closed by clicking backdrop */
  closeOnBackdrop?: boolean;
  /** Whether modal can be closed by pressing Escape */
  closeOnEscape?: boolean;
  /** Whether to show close button in header */
  showCloseButton?: boolean;
  /** Whether modal is centered vertically */
  centered?: boolean;
  /** Whether modal has fade animation */
  fade?: boolean;
  /** Custom header content */
  header?: React.ReactNode;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** ARIA labelledby for accessibility */
  ariaLabelledBy?: string;
  /** Z-index for modal */
  zIndex?: number;
  /** Custom styles */
  style?: React.CSSProperties;
}

export interface ModalHeaderProps extends BaseComponentProps {
  /** Header title */
  title?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Function called when close button is clicked */
  onClose?: () => void;
}

export interface ModalBodyProps extends BaseComponentProps {
  /** Whether body has padding */
  padding?: boolean;
}

export interface ModalFooterProps extends BaseComponentProps {
  /** Footer alignment */
  align?: 'start' | 'center' | 'end' | 'between';
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading text */
  text?: string;
  /** Whether to center the spinner */
  centered?: boolean;
}

// Data Display Component Types
export interface TableColumn<T = any> {
  /** Column key */
  key: string;
  /** Column header */
  header: string;
  /** Data accessor - property key or function */
  accessor?: keyof T | ((row: T) => any);
  /** Cell renderer function */
  render?: (value: any, row: T, index: number) => ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Column width */
  width?: string | number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column should be hidden on mobile */
  hiddenOnMobile?: boolean;
}

export interface TableSortState {
  /** Column key being sorted */
  column: string | null;
  /** Sort direction */
  direction: SortDirection | null;
}

export interface TablePaginationConfig {
  /** Current page (1-based) */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Page size options */
  pageSizeOptions?: number[];
}

export interface TableProps<T = any> extends BaseComponentProps {
  /** Table data */
  data: T[];
  /** Table columns */
  columns: TableColumn<T>[];
  /** Whether table is loading */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Table size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether table is striped */
  striped?: boolean;
  /** Whether table is bordered */
  bordered?: boolean;
  /** Whether table is hoverable */
  hover?: boolean;
  /** Whether table is responsive */
  responsive?: boolean;
  /** Sort configuration */
  sortable?: boolean;
  /** Initial sort state */
  defaultSort?: TableSortState;
  /** Sort change handler */
  onSort?: (sortState: TableSortState) => void;
  /** Whether to show pagination */
  pagination?: boolean;
  /** Pagination configuration */
  paginationConfig?: TablePaginationConfig;
  /** Current page (0-indexed) */
  currentPage?: number;
  /** Items per page */
  pageSize?: number;
  /** Total items for pagination */
  totalItems?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Row click handler */
  onRowClick?: (record: T, index: number) => void;
  /** Custom row class name */
  rowClassName?: (record: T, index: number) => string;
}

// Financial data types for the tax calculator
export interface Security {
  symbol: string;
  name?: string;
}

export interface HoldingData {
  security: Security;
  quantity: number;
  average_cost_gbp: number;
  current_value_gbp: number;
  total_cost_gbp?: number;
  unrealized_gain_loss: number;
  total_return_pct?: number;
}

export interface DividendData {
  payment_date: string;
  security: Security;
  amount_gbp: number;
  withholding_tax_gbp?: number;
  net_amount_gbp?: number;
}

export interface DisposalData {
  disposal_date: string;
  security: Security;
  quantity: number;
  proceeds: number;
  cost_basis: number;
  gain_or_loss: number;
}

// Card Component Types
export type CardVariant = 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

export interface CardProps extends BaseComponentProps {
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Card image URL */
  image?: string;
  /** Card image alt text */
  imageAlt?: string;
  /** Whether card has border */
  bordered?: boolean;
  /** Whether card has hover effect */
  hoverable?: boolean;
  /** Card variant for styling */
  variant?: CardVariant;
  /** Card header content */
  header?: ReactNode;
  /** Card footer content */
  footer?: ReactNode;
  /** Card actions */
  actions?: ReactNode;
  /** Whether card content should be centered */
  centered?: boolean;
}

// Accordion Component Types
export interface AccordionItem {
  /** Unique item ID */
  id: string;
  /** Item header/title */
  header: ReactNode;
  /** Item content */
  content: ReactNode;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Custom CSS class for item */
  className?: string;
}

export interface AccordionProps extends BaseComponentProps {
  /** Accordion items */
  items: AccordionItem[];
  /** Whether multiple items can be open */
  allowMultiple?: boolean;
  /** Initially expanded item IDs */
  defaultExpanded?: string[];
  /** Controlled expanded state */
  expanded?: string[];
  /** Expand/collapse handler */
  onToggle?: (itemId: string, isExpanded: boolean) => void;
  /** Whether accordion has borders */
  bordered?: boolean;
  /** Whether accordion has flush design (no outer borders) */
  flush?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
}

// Tabs Component Types
export interface TabItem {
  /** Unique tab ID */
  id: string;
  /** Tab label/title */
  label: ReactNode;
  /** Tab content */
  content: ReactNode;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Custom CSS class for tab */
  className?: string;
}

export interface TabsProps extends BaseComponentProps {
  /** Tab items */
  items: TabItem[];
  /** Active tab ID (controlled) */
  activeTab?: string;
  /** Default active tab ID (uncontrolled) */
  defaultActiveTab?: string;
  /** Tab change handler */
  onTabChange?: (tabId: string) => void;
  /** Tab variant style */
  variant?: 'tabs' | 'pills' | 'underline';
  /** Whether tabs are justified (fill width) */
  justified?: boolean;
  /** Whether tabs are vertical layout */
  vertical?: boolean;
  /** Whether content has fade animation */
  fade?: boolean;
  /** Whether to lazy load content */
  lazy?: boolean;
}

//
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