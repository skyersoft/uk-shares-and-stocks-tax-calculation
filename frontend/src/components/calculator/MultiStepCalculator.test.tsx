import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiStepCalculator } from './MultiStepCalculator';
import { CalculationProvider } from '../../context/CalculationContext';
import type { FileInspection, InspectionResult, Verdict } from '../../types/inspection';

jest.mock('../../services/apiBase', () => ({ getApiBase: () => '' }));
jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  inspectFiles: jest.fn(),
  detectBroker: jest.fn(),
}));
jest.mock('../../utils/filePrecheck', () => ({
  ...jest.requireActual('../../utils/filePrecheck'),
  precheckFile: jest.fn(),
}));

import { inspectFiles, detectBroker, InspectError } from '../../services/api';
import { precheckFile } from '../../utils/filePrecheck';

const mockInspect = inspectFiles as jest.MockedFunction<typeof inspectFiles>;

const ins = (filename: string, verdict: Verdict): FileInspection => ({
  filename,
  format: { id: 'trading212', name: 'Trading 212', confidence: 0.95, supported: true },
  verdict,
  columns: [],
  rows: { total: 3, usable: 3, skipped: [] },
  summary: { buys: 2, sells: 1, tickers: ['TSLA'], currencies: ['GBP'], first_date: '2025-06-03', last_date: '2025-09-01', tax_years: ['2025-2026'] },
  next_actions: [{ id: 'remove_file', label: 'Remove file' }],
  warnings: [],
});

const sellWithoutBuy = (files: FileInspection[]): InspectionResult => ({
  files,
  expectations: [{ rule: 'every_sell_has_earlier_buy', passed: false,
    details: [{ symbol: 'TSLA', date: '2025-07-01', quantity: '3', filename: files[0].filename, file_index: 0 }] }],
  can_continue: true,
  requires_acknowledgement: true,
});

const renderCalc = (initialState?: any) => render(
  <CalculationProvider initialState={initialState}>
    <MultiStepCalculator onComplete={jest.fn()} onCancel={jest.fn()} />
  </CalculationProvider>
);

const goToUpload = () => fireEvent.click(screen.getByRole('button', { name: /Next/ }));
const upload = (container: HTMLElement, ...files: File[]) => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
};
const mkFile = (name: string) => new File(['x,y\n1,2'], name, { type: 'text/csv' });
const nextButton = () => screen.getByRole('button', { name: /Next/ });

beforeEach(() => {
  jest.clearAllMocks();
  (precheckFile as jest.Mock).mockResolvedValue({ ok: true });
  (detectBroker as jest.Mock).mockResolvedValue({ detected: true, broker: 'Trading 212', confidence: 0.9 });
});

describe('MultiStepCalculator', () => {
  describe('Basic Rendering', () => {
    it('renders the multi-step calculator with step 1 initially', () => {
      renderCalc();
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });

    it('does not show Back button on first step', () => {
      renderCalc();
      expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
    });

    it('has accessible form labels', () => {
      renderCalc();
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    });

    it('shows all wizard steps in progress indicator', () => {
      renderCalc();
      expect(screen.getAllByText(/Income Sources|Upload & Details|Personal Details|Review & Calculate/i).length).toBeGreaterThan(0);
    });

    it.each([375, 1920])('renders at viewport width %i', (w) => {
      global.innerWidth = w;
      global.dispatchEvent(new Event('resize'));
      renderCalc();
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });
  });

  describe('Upload step gating', () => {
    it('disables Next with a reason when a file is blocked', async () => {
      mockInspect.mockResolvedValue({ files: [ins('a.csv', 'blocked')], expectations: [], can_continue: false, requires_acknowledgement: false });
      const { container } = renderCalc();
      goToUpload();
      upload(container, mkFile('a.csv'));
      expect(await screen.findByText('Fix or remove file a.csv to continue')).toBeInTheDocument();
      expect(nextButton()).toBeDisabled();
    });

    it('does not block on ready_with_warnings', async () => {
      mockInspect.mockResolvedValue({ files: [ins('a.csv', 'ready_with_warnings')], expectations: [], can_continue: true, requires_acknowledgement: false });
      const { container } = renderCalc();
      goToUpload();
      upload(container, mkFile('a.csv'));
      await screen.findByLabelText('Checks on this file');
      await waitFor(() => expect(nextButton()).toBeEnabled());
    });

    it('requires the acknowledgement for a sell with no earlier buy', async () => {
      mockInspect.mockResolvedValue(sellWithoutBuy([ins('a.csv', 'ready_with_warnings')]));
      const { container } = renderCalc();
      goToUpload();
      upload(container, mkFile('a.csv'));
      const box = await screen.findByLabelText(/I understand my history is incomplete/);
      await waitFor(() => expect(nextButton()).toBeDisabled());
      expect(screen.getByText(/Tick .I understand my history is incomplete. to continue/)).toBeInTheDocument();
      fireEvent.click(box);
      await waitFor(() => expect(nextButton()).toBeEnabled());
    });

    it('resets the acknowledgement when files change', async () => {
      mockInspect.mockImplementation(async (fs: File[]) => sellWithoutBuy(fs.map(f => ins(f.name, 'ready_with_warnings'))));
      const { container } = renderCalc();
      goToUpload();
      upload(container, mkFile('a.csv'));
      fireEvent.click(await screen.findByLabelText(/I understand my history is incomplete/));
      await waitFor(() => expect(nextButton()).toBeEnabled());
      upload(container, mkFile('b.csv'));
      await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(nextButton()).toBeDisabled());
      expect(screen.getByLabelText(/I understand my history is incomplete/)).not.toBeChecked();
    });

    it('leaves Next enabled with a notice when inspection is unavailable', async () => {
      mockInspect.mockRejectedValue(new InspectError('network', 'offline'));
      const { container } = renderCalc();
      goToUpload();
      upload(container, mkFile('a.csv'));
      expect(await screen.findByText(/We couldn't check your file just now/)).toBeInTheDocument();
      await waitFor(() => expect(nextButton()).toBeEnabled());
    });
  });

  describe('Calculate-time errors', () => {
    const base = { status: 'error', result: null, raw: null, wizardData: null };

    it('renders missing and required columns as lists', () => {
      renderCalc({ ...base, error: 'Invalid CSV format',
        errorDetail: { kind: 'missing_columns', message: 'Invalid CSV format', missingColumns: ['Quantity', 'Price'], requiredColumns: ['Date', 'Quantity', 'Price'] } });
      const missing = screen.getByRole('list', { name: 'Missing columns' });
      expect(missing.querySelectorAll('li')).toHaveLength(2);
      expect(screen.getByRole('list', { name: 'Required columns' }).querySelectorAll('li')).toHaveLength(3);
      expect(screen.getByRole('link', { name: /export instructions/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact us/i })).toBeInTheDocument();
    });

    it('renders supported brokers as a list', () => {
      renderCalc({ ...base, error: 'Could not detect broker',
        errorDetail: { kind: 'unknown_broker', message: 'Could not detect broker', supportedBrokers: ['Trading 212', 'Freetrade'] } });
      expect(screen.getByRole('list', { name: 'Supported brokers' }).querySelectorAll('li')).toHaveLength(2);
      fireEvent.click(screen.getByRole('button', { name: /remove the file/i }));
      expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();
    });
  });
});
