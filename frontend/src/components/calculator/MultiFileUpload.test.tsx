import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiFileUpload, UploadGate } from './MultiFileUpload';
import type { BrokerFile } from '../../types/calculator';
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
jest.mock('../../utils/analytics', () => ({
  trackInspection: jest.fn(),
  trackInspectionAction: jest.fn(),
}));

import { inspectFiles, detectBroker, InspectError } from '../../services/api';
import { precheckFile } from '../../utils/filePrecheck';
import { trackInspection, trackInspectionAction } from '../../utils/analytics';

const mockInspect = inspectFiles as jest.MockedFunction<typeof inspectFiles>;
const mockDetect = detectBroker as jest.MockedFunction<typeof detectBroker>;
const mockPrecheck = precheckFile as jest.MockedFunction<typeof precheckFile>;

const ins = (filename: string, verdict: Verdict = 'ready', over: Partial<FileInspection> = {}): FileInspection => ({
  filename,
  format: { id: 'trading212', name: 'Trading 212', confidence: 0.95, supported: true },
  verdict,
  columns: [],
  rows: { total: 3, usable: 3, skipped: [] },
  summary: { buys: 2, sells: 1, tickers: ['TSLA'], currencies: ['GBP'], first_date: '2025-06-03', last_date: '2025-09-01', tax_years: ['2025-2026'] },
  next_actions: [{ id: 'remove_file', label: 'Remove file' }],
  warnings: [],
  ...over,
});

const res = (files: FileInspection[], over: Partial<InspectionResult> = {}): InspectionResult => ({
  files,
  expectations: [{ rule: 'every_sell_has_earlier_buy', passed: true, details: [] }],
  can_continue: true,
  requires_acknowledgement: false,
  ...over,
});

const mkFile = (name: string, size = 10) => new File([new Uint8Array(size)], name, { type: 'text/csv' });

let lastGate: UploadGate | null = null;
let ackSpy: jest.Mock;

const Harness: React.FC = () => {
  const [files, setFiles] = useState<BrokerFile[]>([]);
  const [ack, setAck] = useState(false);
  return (
    <div>
      <MultiFileUpload
        files={files}
        onChange={setFiles}
        acknowledged={ack}
        onAcknowledgeChange={(v) => { ackSpy(v); setAck(v); }}
        onGateChange={(g) => { lastGate = g; }}
      />
      <span data-testid="ack">{String(ack)}</span>
      <span data-testid="count">{files.length}</span>
    </div>
  );
};

const upload = (container: HTMLElement, ...files: File[]) => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
};

beforeEach(() => {
  jest.clearAllMocks();
  lastGate = null;
  ackSpy = jest.fn();
  mockPrecheck.mockResolvedValue({ ok: true });
  mockDetect.mockResolvedValue({ detected: true, broker: 'Trading 212', confidence: 0.9 });
});

describe('MultiFileUpload with File X-ray', () => {
  it('shows the instant failure screen for a wrong-type file without calling the API', async () => {
    mockPrecheck.mockResolvedValue({ ok: false, kind: 'wrong_type', message: 'That looks like a PDF. We need the CSV or QFX export from your broker.' });
    const { container } = render(<Harness />);
    upload(container, mkFile('statement.csv'));
    expect(await screen.findByText('That is not a CSV or QFX file')).toBeInTheDocument();
    expect(screen.getByText(/That looks like a PDF/)).toBeInTheDocument();
    await new Promise(r => setTimeout(r, 300));
    expect(mockInspect).not.toHaveBeenCalled();
    expect(lastGate?.blockedReason).toMatch(/Fix or remove file statement\.csv to continue/);
  });

  it('treats a non-CSV/QFX extension as the wrong type, not a plain alert', async () => {
    const { container } = render(<Harness />);
    upload(container, mkFile('statement.pdf'));
    expect(await screen.findByText('That is not a CSV or QFX file')).toBeInTheDocument();
    expect(mockInspect).not.toHaveBeenCalled();
  });

  it('shows a checking row while inspecting, then the X-ray', async () => {
    let resolve!: (r: InspectionResult) => void;
    mockInspect.mockReturnValue(new Promise(r => { resolve = r; }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    expect(await screen.findByText(/Checking a\.csv/)).toBeInTheDocument();
    await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(1));
    expect(lastGate?.blockedReason).toMatch(/Checking/);
    await act(async () => { resolve(res([ins('a.csv')])); });
    expect(await screen.findByLabelText('Checks on this file')).toBeInTheDocument();
    expect(lastGate).toEqual({ blockedReason: null, requiresAck: false });
  });

  it('re-calls inspectFiles with all files when a second file is added', async () => {
    mockInspect.mockImplementation(async (fs: File[]) => res(fs.map(f => ins(f.name))));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(1));
    upload(container, mkFile('b.csv'));
    await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(2));
    expect(mockInspect.mock.calls[1][0].map(f => f.name)).toEqual(['a.csv', 'b.csv']);
  });

  it('ignores a stale response that resolves after a newer one', async () => {
    const resolvers: Array<(r: InspectionResult) => void> = [];
    mockInspect.mockImplementation(() => new Promise(r => { resolvers.push(r); }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(1));
    upload(container, mkFile('b.csv'));
    await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(2));
    await act(async () => { resolvers[1](res([ins('a.csv'), ins('b.csv')])); });
    await act(async () => { resolvers[0](res([ins('a.csv', 'blocked')])); });
    expect(screen.queryByText(/cannot read it yet/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText('Checks on this file')).toHaveLength(2);
    expect(lastGate?.blockedReason).toBeNull();
  });

  it.each([
    ['blocked', 'We recognise this file, but cannot read it yet'],
    ['unsupported_format', 'We recognise this file, but it is the wrong report'],
    ['no_trades', 'We cannot see any trades in this file'],
    ['unknown', 'We could not recognise this file'],
  ] as Array<[Verdict, string]>)('%s shows the failure screen and blocks with a reason', async (verdict, title) => {
    mockInspect.mockResolvedValue(res([ins('a.csv', verdict)], { can_continue: false }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(lastGate?.blockedReason).toBe('Fix or remove file a.csv to continue');
  });

  it('ready_with_warnings does not block and shows warnings with a symbol', async () => {
    mockInspect.mockResolvedValue(res([ins('a.csv', 'ready_with_warnings', { warnings: ['Prices may be in pence'] })]));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    expect(await screen.findByText(/Prices may be in pence/)).toBeInTheDocument();
    expect(screen.getByText(/Prices may be in pence/).closest('li')).toHaveTextContent('⚠');
    expect(lastGate).toEqual({ blockedReason: null, requiresAck: false });
  });

  it('reports requiresAck for sell-without-buy and the checkbox drives the shared flag', async () => {
    mockInspect.mockResolvedValue(res([ins('a.csv', 'ready_with_warnings')], {
      requires_acknowledgement: true,
      expectations: [{ rule: 'every_sell_has_earlier_buy', passed: false,
        details: [{ symbol: 'TSLA', date: '2025-07-01', quantity: '3', filename: 'a.csv', file_index: 0 }] }],
    }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    const box = await screen.findByLabelText(/I understand my history is incomplete/);
    expect(lastGate).toEqual({ blockedReason: null, requiresAck: true });
    fireEvent.click(box);
    expect(screen.getByTestId('ack')).toHaveTextContent('true');
  });

  it('resets the acknowledgement when the file list changes', async () => {
    mockInspect.mockImplementation(async (fs: File[]) => res(fs.map(f => ins(f.name, 'ready_with_warnings')), {
      requires_acknowledgement: true,
      expectations: [{ rule: 'every_sell_has_earlier_buy', passed: false,
        details: [{ symbol: 'TSLA', date: '2025-07-01', quantity: '3', filename: 'a.csv', file_index: 0 }] }],
    }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    fireEvent.click(await screen.findByLabelText(/I understand my history is incomplete/));
    expect(screen.getByTestId('ack')).toHaveTextContent('true');
    upload(container, mkFile('b.csv'));
    await waitFor(() => expect(screen.getByTestId('ack')).toHaveTextContent('false'));
  });

  it('remove_file action removes the file', async () => {
    mockInspect.mockResolvedValue(res([ins('a.csv', 'blocked')], { can_continue: false }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    await screen.findByText(/cannot read it yet/);
    fireEvent.click(screen.getByRole('button', { name: 'Remove file' }));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(trackInspectionAction).toHaveBeenCalledWith('remove_file', 'blocked');
  });

  it('add_opening_holdings shows a coming-soon notice', async () => {
    mockInspect.mockResolvedValue(res([ins('a.csv', 'ready_with_warnings')], {
      requires_acknowledgement: true,
      expectations: [{ rule: 'every_sell_has_earlier_buy', passed: false,
        details: [{ symbol: 'TSLA', date: '2025-07-01', quantity: '3', filename: 'a.csv', file_index: 0 }] }],
    }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    fireEvent.click(await screen.findByRole('button', { name: 'Add opening holdings' }));
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('request_support opens the feedback form', async () => {
    mockInspect.mockResolvedValue(res([ins('a.csv', 'unknown', { format: null })], { can_continue: false }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    fireEvent.click(await screen.findByRole('button', { name: 'Ask us to add support' }));
    expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
  });

  it('unknown shows request support and remove, but no pick broker button', async () => {
    mockInspect.mockResolvedValue(res([ins('a.csv', 'unknown', { format: null,
      next_actions: [{ id: 'pick_broker', label: 'Pick my broker instead' }, { id: 'remove_file', label: 'Remove file' }] })],
      { can_continue: false }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    expect(await screen.findByRole('button', { name: 'Ask us to add support' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove file' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pick my broker/ })).toBeNull();
  });

  // The inspect budget (4 MiB) is below the /calculate ceiling (MAX_UPLOAD_BYTES): a file that is
  // too big to CHECK must still be calculable, so it gets a notice, not a blocking failure.
  it('a JSON 413 from the check marks the file not checked and keeps Continue open', async () => {
    mockInspect.mockRejectedValue(new InspectError('server', 'Request too large', 413));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    expect(await screen.findByText(/too large to check here, you can still calculate/)).toBeInTheDocument();
    expect(screen.queryByText('That file is too large')).toBeNull();
    await waitFor(() => expect(lastGate).toEqual({ blockedReason: null, requiresAck: false }));
  });

  it('a too_large InspectError marks the file not checked', async () => {
    mockInspect.mockRejectedValue(new InspectError('too_large', 'Too large'));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    expect(await screen.findByText(/too large to check here, you can still calculate/)).toBeInTheDocument();
    await waitFor(() => expect(lastGate?.blockedReason).toBeNull());
  });

  it('total over the inspect budget: overflow file not checked, Continue enabled', async () => {
    mockInspect.mockImplementation(async (fs: File[]) => res(fs.map(f => ins(f.name))));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv', 2.5 * 1024 * 1024), mkFile('b.csv', 2.5 * 1024 * 1024));
    expect(await screen.findByText(/too large to check here, you can still calculate/)).toBeInTheDocument();
    await waitFor(() => expect(mockInspect).toHaveBeenCalled());
    expect(mockInspect.mock.calls[0][0].map(f => f.name)).toEqual(['a.csv']);
    expect(screen.queryByText('That file is too large')).toBeNull();
    await waitFor(() => expect(lastGate).toEqual({ blockedReason: null, requiresAck: false }));
  });

  it('one file over the inspect budget but under the hard limit is not sent and does not block', async () => {
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv', 4.5 * 1024 * 1024));
    expect(await screen.findByText(/too large to check here, you can still calculate/)).toBeInTheDocument();
    await new Promise(r => setTimeout(r, 300));
    expect(mockInspect).not.toHaveBeenCalled();
    expect(lastGate).toEqual({ blockedReason: null, requiresAck: false });
  });

  it('total over the /calculate ceiling blocks the overflow file as too large', async () => {
    mockInspect.mockImplementation(async (fs: File[]) => res(fs.map(f => ins(f.name))));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv', 3 * 1024 * 1024), mkFile('b.csv', 3 * 1024 * 1024));
    expect(await screen.findByText('That file is too large')).toBeInTheDocument();
    await waitFor(() => expect(mockInspect).toHaveBeenCalled());
    expect(mockInspect.mock.calls[0][0].map(f => f.name)).toEqual(['a.csv']);
    await waitFor(() => expect(lastGate?.blockedReason).toBe('Fix or remove file b.csv to continue'));
  });

  it('matches sells without a buy to the file by index, not by name', async () => {
    mockInspect.mockImplementation(async (fs: File[]) => res(fs.map(f => ins(f.name, 'ready_with_warnings')), {
      requires_acknowledgement: true,
      expectations: [{ rule: 'every_sell_has_earlier_buy', passed: false,
        details: [{ symbol: 'TSLA', date: '2025-07-01', quantity: '3', filename: 'same.csv', file_index: 1 }] }],
    }));
    const { container } = render(<Harness />);
    upload(container, mkFile('same.csv'), mkFile('same.csv'));
    await waitFor(() => expect(screen.getAllByLabelText('Checks on this file')).toHaveLength(2));
    const boxes = await screen.findAllByTestId('sell-without-buy');
    expect(boxes).toHaveLength(1);
    const items = Array.from(container.querySelectorAll('.list-group-item'));
    expect(items[0].querySelector('[data-testid="sell-without-buy"]')).toBeNull();
    expect(items[1].querySelector('[data-testid="sell-without-buy"]')).not.toBeNull();
  });

  it.each([['server'], ['network']] as const)('%s failure does not block and offers retry', async (kind) => {
    mockInspect.mockRejectedValueOnce(new InspectError(kind, 'boom'));
    mockInspect.mockResolvedValueOnce(res([ins('a.csv')]));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    expect(await screen.findByText(/We couldn't check your file just now/)).toBeInTheDocument();
    expect(lastGate).toEqual({ blockedReason: null, requiresAck: false });
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(2));
    expect(await screen.findByLabelText('Checks on this file')).toBeInTheDocument();
  });

  it('tracks each file verdict once per result', async () => {
    mockInspect.mockResolvedValue(res([ins('a.csv', 'ready'), ins('b.csv', 'blocked', { format: null })]));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'), mkFile('b.csv'));
    await screen.findByText(/cannot read it yet/);
    expect(trackInspection).toHaveBeenCalledTimes(2);
    expect(trackInspection).toHaveBeenCalledWith('ready', 'trading212', 2);
    expect(trackInspection).toHaveBeenCalledWith('blocked', null, 2);
  });

  it('ignores a response that arrives after unmount (no telemetry)', async () => {
    let resolve!: (r: InspectionResult) => void;
    mockInspect.mockReturnValue(new Promise(r => { resolve = r; }));
    const { container, unmount } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => { resolve(res([ins('a.csv')])); });
    expect(trackInspection).not.toHaveBeenCalled();
  });

  it('ignores a response that arrives after the list became empty', async () => {
    let resolve!: (r: InspectionResult) => void;
    mockInspect.mockReturnValue(new Promise(r => { resolve = r; }));
    const { container } = render(<Harness />);
    upload(container, mkFile('a.csv'));
    await waitFor(() => expect(mockInspect).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.csv' }));
    await act(async () => { resolve(res([ins('a.csv')])); });
    expect(trackInspection).not.toHaveBeenCalled();
  });

  it('a hung check times out after 20 s and leaves Continue open with the notice', async () => {
    jest.useFakeTimers();
    try {
      const actual = jest.requireActual('../../services/api');
      mockInspect.mockImplementation(actual.inspectFiles);
      (global as any).fetch = jest.fn(() => new Promise(() => {}));
      const { container } = render(<Harness />);
      upload(container, mkFile('a.csv'));
      await waitFor(() => expect((global as any).fetch).toHaveBeenCalledTimes(1));
      expect(lastGate?.blockedReason).toMatch(/Checking/);
      await act(async () => { jest.advanceTimersByTime(20_000); });
      expect(await screen.findByText(/We couldn't check your file just now/)).toBeInTheDocument();
      expect(lastGate).toEqual({ blockedReason: null, requiresAck: false });
    } finally {
      jest.useRealTimers();
    }
  });
});
