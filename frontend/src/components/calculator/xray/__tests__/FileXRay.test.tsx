import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileXRay } from '../FileXRay';
import { FailureScreen } from '../FailureScreen';
import { ProgressStrip } from '../ProgressStrip';
import type { FileInspection, InspectionResult, ColumnInfo } from '../../../../types/inspection';

const col = (over: Partial<ColumnInfo>): ColumnInfo => ({
  header: 'Ticker', mapped_to: 'Symbol', status: 'understood', filled: 10, blank: 0,
  samples: ['A', 'B', 'C', 'D', 'E'], note: null, ...over,
});

const baseInspection = (over: Partial<FileInspection> = {}): FileInspection => ({
  filename: 't212.csv',
  format: { id: 'trading212', name: 'Trading 212', confidence: 0.96, supported: true },
  verdict: 'ready_with_warnings',
  columns: [
    col({ header: 'Ticker' }),
    col({ header: 'Price', mapped_to: 'Price', status: 'check', note: 'pence?', filled: 5, blank: 5, samples: ['68.12'] }),
    col({ header: 'Notes', mapped_to: null, status: 'ignored' }),
    col({ header: 'Time', mapped_to: 'Date' }),
  ],
  rows: { total: 12, usable: 10, skipped: [{ reason: 'deposit', count: 2 }] },
  summary: { buys: 6, sells: 4, tickers: ['TSLA', 'VUSA'], currencies: ['GBP', 'USD'],
    first_date: '2025-06-03', last_date: '2026-02-28', tax_years: ['2025-2026'] },
  next_actions: [
    { id: 'show_skipped_rows', label: 'Show skipped rows' },
    { id: 'remove_file', label: 'Remove file' },
  ],
  warnings: [],
  ...over,
});

const baseResult = (over: Partial<InspectionResult> = {}): InspectionResult => ({
  files: [],
  expectations: [{
    rule: 'every_sell_has_earlier_buy', passed: false,
    details: [
      { symbol: 'TSLA', date: '2026-01-12', quantity: '12', filename: 't212.csv' },
      { symbol: 'VUSA', date: '2026-02-04', quantity: '5.5', filename: 't212.csv' },
    ],
  }],
  can_continue: true, requires_acknowledgement: true, ...over,
});

describe('ProgressStrip', () => {
  it('shows four stages with states for ready_with_warnings', () => {
    render(<ProgressStrip inspection={baseInspection({ warnings: ['w1', 'w2'] })} />);
    const stages = screen.getAllByRole('listitem');
    expect(stages).toHaveLength(4);
    expect(stages[0]).toHaveAttribute('data-state', 'done');
    expect(stages[1]).toHaveAttribute('data-state', 'current');
    expect(stages[3]).toHaveAttribute('data-state', 'current');
    expect(stages[3]).toHaveTextContent(/Yes, with 2 warnings/);
  });

  it('marks columns and ready as failed for unsupported_format', () => {
    render(<ProgressStrip inspection={baseInspection({ verdict: 'unsupported_format', columns: [] })} />);
    const stages = screen.getAllByRole('listitem');
    expect(stages[1]).toHaveAttribute('data-state', 'failed');
    expect(stages[2]).toHaveAttribute('data-state', 'pending');
    expect(stages[3]).toHaveAttribute('data-state', 'failed');
  });

  it('shows all done for ready', () => {
    render(<ProgressStrip inspection={baseInspection({
      verdict: 'ready', columns: [col({})], rows: { total: 3, usable: 3, skipped: [] } })} />);
    screen.getAllByRole('listitem').forEach(s => expect(s).toHaveAttribute('data-state', 'done'));
  });
});

describe('ColumnTable inside FileXRay', () => {
  it('renders status as text and a progressbar with aria values', () => {
    render(<FileXRay inspection={baseInspection()} result={baseResult()} onAction={jest.fn()} />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: /your header/i })).toBeInTheDocument();
    expect(within(table).getByText(/check/i)).toBeInTheDocument();
    const bars = within(table).getAllByRole('progressbar');
    const priceBar = bars.find(b => b.getAttribute('aria-valuenow') === '5');
    expect(priceBar).toBeDefined();
    expect(priceBar).toHaveAttribute('aria-valuemin', '0');
    expect(priceBar).toHaveAttribute('aria-valuemax', '10');
  });

  it('caps samples at three', () => {
    render(<FileXRay inspection={baseInspection()} result={baseResult()} onAction={jest.fn()} />);
    const table = screen.getByRole('table');
    expect(within(table).queryByText(/D, E/)).toBeNull();
    expect(within(table).getAllByText('A, B, C').length).toBeGreaterThan(0);
  });

  it('lists problem columns first in the card list', () => {
    render(<FileXRay inspection={baseInspection()} result={baseResult()} onAction={jest.fn()} />);
    const cards = within(screen.getByTestId('column-cards')).getAllByTestId('column-card');
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveTextContent('Price');
  });
});

describe('SummaryBoxes inside FileXRay', () => {
  it('shows what we can see', () => {
    render(<FileXRay inspection={baseInspection()} result={baseResult()} onAction={jest.fn()} />);
    expect(screen.getByText(/What we can see/i)).toBeInTheDocument();
    expect(screen.getByText(/6 buys, 4 sells/)).toBeInTheDocument();
    expect(screen.getByText(/2 tickers, 2 currencies/)).toBeInTheDocument();
    expect(screen.getByText(/2025-2026/)).toBeInTheDocument();
  });

  it('lists each sell without a buy, the effect, fix buttons and acknowledgement', () => {
    const onAction = jest.fn();
    const onAck = jest.fn();
    render(<FileXRay inspection={baseInspection()} result={baseResult()} onAction={onAction}
      acknowledged={false} onAcknowledgeChange={onAck} />);
    expect(screen.getByText(/TSLA/)).toBeInTheDocument();
    expect(screen.getByText(/2026-01-12/)).toBeInTheDocument();
    expect(screen.getByText(/VUSA/)).toBeInTheDocument();
    expect(screen.getByText(/5\.5/)).toBeInTheDocument();
    expect(screen.getByText(/missing those shares and their cost/i)).toBeInTheDocument();
    const sellBox = screen.getByTestId('sell-without-buy');
    expect(within(sellBox).getByText(/understated/i)).toBeInTheDocument();
    expect(within(sellBox).getByText(/overstated/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add another file|add earlier/i }));
    expect(onAction).toHaveBeenCalledWith('add_earlier_file', 't212.csv');
    fireEvent.click(screen.getByRole('button', { name: /opening holdings/i }));
    expect(onAction).toHaveBeenCalledWith('add_opening_holdings', 't212.csv');
    const box = screen.getByLabelText(/I understand my history is incomplete/i);
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    expect(onAck).toHaveBeenCalledWith(true);
  });

  it('omits the checkbox when acknowledgement is not required', () => {
    render(<FileXRay inspection={baseInspection()} result={baseResult({ requires_acknowledgement: false })}
      onAction={jest.fn()} />);
    expect(screen.queryByLabelText(/I understand my history is incomplete/i)).toBeNull();
  });

  it('shows skipped rows by reason with an action, and the missing history message', () => {
    const onAction = jest.fn();
    render(<FileXRay inspection={baseInspection()} result={baseResult({ expectations: [] })} onAction={onAction} />);
    expect(screen.getByText(/deposit: 2/)).toBeInTheDocument();
    expect(screen.getByText(/No buys before 2025-06-03/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /show skipped rows/i }));
    expect(onAction).toHaveBeenCalledWith('show_skipped_rows', 't212.csv');
    fireEvent.click(screen.getByRole('button', { name: /remove file/i }));
    expect(onAction).toHaveBeenCalledWith('remove_file', 't212.csv');
  });
});

describe('FailureScreen', () => {
  const unsupported = baseInspection({
    filename: 'activity.csv', verdict: 'unsupported_format', columns: [],
    format: { id: 'ibkr_activity', name: 'IBKR Activity Statement', confidence: 1, supported: false },
    warnings: ['This is a summary report.', 'Step 1: Open Flex Queries', 'Step 2: Choose Trades'],
    next_actions: [
      { id: 'view_export_steps', label: 'How to export this file' },
      { id: 'request_support', label: 'Ask us to add support' },
      { id: 'remove_file', label: 'Remove file' },
    ],
  });

  it('unsupported_format shows export steps and buttons', () => {
    const onAction = jest.fn();
    render(<FailureScreen kind="unsupported_format" inspection={unsupported} onAction={onAction} />);
    expect(screen.getByText('This is a summary report.')).toBeInTheDocument();
    expect(screen.getByText(/Open Flex Queries/)).toBeInTheDocument();
    expect(screen.getByText(/Choose Trades/)).toBeInTheDocument();
    ['view_export_steps', 'request_support', 'remove_file'].forEach(id => {
      const label = unsupported.next_actions.find(a => a.id === id)!.label;
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(onAction).toHaveBeenCalledWith(id, 'activity.csv');
    });
  });

  it('no_trades shows the message for variant (a)', () => {
    const ins = baseInspection({
      verdict: 'no_trades', columns: [],
      warnings: ['Your statement was generated without the Trades section, so we cannot see individual trades.'],
      next_actions: [{ id: 'view_export_steps', label: 'How to export this file' }, { id: 'remove_file', label: 'Remove file' }],
    });
    render(<FailureScreen kind="no_trades" inspection={ins} onAction={jest.fn()} />);
    expect(screen.getByText(/without the Trades section/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /how to export/i })).toBeInTheDocument();
  });

  it('no_trades shows the message for variant (b)', () => {
    const ins = baseInspection({
      verdict: 'no_trades', columns: [],
      warnings: ['There are no trades in this period. Upload a period that has trades.'],
      next_actions: [{ id: 'add_earlier_file', label: 'Add another file' }, { id: 'remove_file', label: 'Remove file' }],
    });
    render(<FailureScreen kind="no_trades" inspection={ins} onAction={jest.fn()} />);
    expect(screen.getByText(/no trades in this period/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add another file' })).toBeInTheDocument();
  });

  it('unknown offers request support and remove even with no next_actions, but not pick broker yet', () => {
    const onAction = jest.fn();
    const ins = baseInspection({ verdict: 'unknown', format: null, next_actions: [],
      columns: [col({ header: 'Trade Date', mapped_to: 'Date' })] });
    render(<FailureScreen kind="unknown" inspection={ins} onAction={onAction} />);
    expect(screen.getByText(/Trade Date/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pick my broker/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /add support/i }));
    expect(onAction).toHaveBeenCalledWith('request_support', 't212.csv');
    expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
  });

  it('blocked shows the warnings and remove button', () => {
    const ins = baseInspection({ verdict: 'blocked', warnings: ['Missing required column: Quantity'], next_actions: [] });
    render(<FailureScreen kind="blocked" inspection={ins} onAction={jest.fn()} />);
    expect(screen.getByText(/Missing required column/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
  });

  it.each(['wrong_type', 'empty', 'too_large'] as const)('precheck failure %s shows message and remove', kind => {
    const onAction = jest.fn();
    render(<FailureScreen kind={kind} fileName="x.pdf" precheck={{ ok: false, kind, message: 'Bad file msg' }}
      onAction={onAction} />);
    expect(screen.getByText('Bad file msg')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove file/i }));
    expect(onAction).toHaveBeenCalledWith('remove_file', 'x.pdf');
  });
});

describe('X-ray review follow-ups', () => {
  it('shows a passing "What we expect" box when every sell has an earlier buy', () => {
    render(<FileXRay inspection={baseInspection()} onAction={jest.fn()}
      result={baseResult({ requires_acknowledgement: false,
        expectations: [{ rule: 'every_sell_has_earlier_buy', passed: true, details: [] }] })} />);
    expect(screen.getByText(/What we expect from a good file/)).toBeInTheDocument();
    expect(screen.getByText('Every sell has an earlier buy in the files you uploaded')).toBeInTheDocument();
    expect(screen.queryByTestId('sell-without-buy')).toBeNull();
  });

  it('gives each acknowledgement checkbox a unique id even with the same filename', () => {
    render(<>
      <FileXRay inspection={baseInspection()} result={baseResult()} onAction={jest.fn()} />
      <FileXRay inspection={baseInspection()} result={baseResult()} onAction={jest.fn()} />
    </>);
    const boxes = screen.getAllByLabelText(/I understand my history is incomplete/i);
    expect(boxes).toHaveLength(2);
    expect(boxes[0].id).not.toBe(boxes[1].id);
  });

  it('hides "No buys before" when the first date is the start of the tax year', () => {
    const ins = baseInspection();
    render(<FileXRay inspection={{ ...ins, summary: { ...ins.summary, first_date: '2025-04-06' } }}
      result={baseResult({ expectations: [] })} onAction={jest.fn()} />);
    expect(screen.queryByText(/No buys before/)).toBeNull();
  });

  it('shows "No buys before" when the first date is later than the start of the tax year', () => {
    const ins = baseInspection();
    render(<FileXRay inspection={{ ...ins, summary: { ...ins.summary, first_date: '2025-04-07' } }}
      result={baseResult({ expectations: [] })} onAction={jest.fn()} />);
    expect(screen.getByText(/No buys before 2025-04-07/)).toBeInTheDocument();
  });

  it('renders duplicate headers without React key warnings', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<FileXRay inspection={baseInspection({ columns: [col({ header: 'Amount' }), col({ header: 'Amount', mapped_to: null, status: 'ignored' })] })}
      result={baseResult()} onAction={jest.fn()} />);
    const keyWarnings = spy.mock.calls.filter(c => String(c[0]).includes('same key'));
    spy.mockRestore();
    expect(keyWarnings).toHaveLength(0);
  });

  it('never renders a pick_broker action even when the backend sends one', () => {
    const ins = baseInspection({ verdict: 'unknown', format: null,
      next_actions: [{ id: 'pick_broker', label: 'Pick my broker instead' }, { id: 'remove_file', label: 'Remove file' }] });
    render(<FailureScreen kind="unknown" inspection={ins} onAction={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /pick my broker/i })).toBeNull();
    expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
  });

  it('prefixes each warning with a visible warning symbol', () => {
    render(<FileXRay inspection={baseInspection({ warnings: ['Prices may be in pence'] })} result={baseResult()} onAction={jest.fn()} />);
    const li = screen.getByText(/Prices may be in pence/).closest('li')!;
    expect(li).toHaveTextContent('⚠');
    expect(li.closest('ul')).not.toHaveClass('text-muted');
  });
});
