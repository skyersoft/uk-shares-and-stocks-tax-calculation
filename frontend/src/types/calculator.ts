/**
 * Types for multi-step tax calculator
 */

export interface IncomeSourceSelection {
  investmentPortfolio: boolean;
  employmentIncome: boolean;
  selfEmploymentIncome: boolean;
  otherDividends: boolean;
  rentalIncome: boolean;
  savingsInterest: boolean;
  otherCapitalGains: boolean;
  pensionContributions: boolean;
}

export interface BrokerFile {
  id: string;
  file: File;
  broker: BrokerType;
  accountName?: string;
}

export type BrokerType = 
  | 'interactive-brokers'
  | 'hargreaves-lansdown'
  | 'trading212'
  | 'freetrade'
  | 'etoro'
  | 'vanguard'
  | 'aj-bell'
  | 'manual-csv';

export const BROKER_OPTIONS: Array<{ value: BrokerType; label: string }> = [
  { value: 'interactive-brokers', label: 'Interactive Brokers' },
  { value: 'hargreaves-lansdown', label: 'Hargreaves Lansdown' },
  { value: 'trading212', label: 'Trading 212' },
  { value: 'freetrade', label: 'Freetrade' },
  { value: 'etoro', label: 'eToro' },
  { value: 'vanguard', label: 'Vanguard' },
  { value: 'aj-bell', label: 'AJ Bell' },
  { value: 'manual-csv', label: 'Manual CSV' }
];

export interface EmploymentIncomeData {
  grossSalary: number;
  bonuses: number;
  benefitsInKind: number;
  payeTaxPaid: number;
  niPaid: number;
  studentLoanDeductions: number;
  employeePensionContributions: number;
  employerPensionContributions: number;
}

export interface RentalIncomeData {
  grossRentalIncome: number;
  mortgageInterest: number;
  repairsCosts: number;
  agentFees: number;
  otherExpenses: number;
  usePropertyAllowance: boolean;
}

export interface SavingsInterestData {
  totalInterest: number;
}

export interface OtherCapitalGainsData {
  propertyGains: Array<{
    id: string;
    description: string;
    acquisitionDate: string;
    disposalDate: string;
    acquisitionCost: number;
    disposalProceeds: number;
    improvementCosts: number;
    sellingCosts: number;
  }>;
  cryptoGains: Array<{
    id: string;
    asset: string;
    acquisitionDate: string;
    disposalDate: string;
    acquisitionCost: number;
    disposalProceeds: number;
  }>;
  otherGains: Array<{
    id: string;
    description: string;
    acquisitionDate: string;
    disposalDate: string;
    acquisitionCost: number;
    disposalProceeds: number;
    costs: number;
  }>;
}

export interface OtherDividendsData {
  ukDividends: number;
  foreignDividends: number;
}

export interface PersonalTaxDetails {
  taxResidency: 'england-wales-ni' | 'scotland';
  dateOfBirth: string;
  claimMarriageAllowance: boolean;
  claimBlindPersonAllowance: boolean;
  carriedForwardLosses: number;
  charitableDonations: number;
  taxCode?: string;
  isRegisteredForSelfAssessment: boolean;
}

export interface WizardData {
  // Step 1
  incomeSources: IncomeSourceSelection;
  taxYear: string;
  analysisType: 'both' | 'tax' | 'portfolio';
  
  // Step 2
  brokerFiles: BrokerFile[];
  employmentIncome?: EmploymentIncomeData;
  rentalIncome?: RentalIncomeData;
  savingsInterest?: SavingsInterestData;
  otherCapitalGains?: OtherCapitalGainsData;
  otherDividends?: OtherDividendsData;
  
  // Step 3
  personalDetails: PersonalTaxDetails;
}

export type WizardStep = 1 | 2 | 3 | 4;

export const WIZARD_STEPS = [
  { step: 1, title: 'Income Sources', description: 'Select your income sources' },
  { step: 2, title: 'Upload & Details', description: 'Upload files and enter income details' },
  { step: 3, title: 'Personal Details', description: 'Tax residency and allowances' },
  { step: 4, title: 'Review & Calculate', description: 'Review and run calculation' }
] as const;
