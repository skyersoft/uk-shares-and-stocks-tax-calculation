import React from 'react';
import type { FileInspection, InspectionResult, NextActionId } from '../../../types/inspection';
import { ACTION_LABELS } from './NextActions';

interface Props {
  inspection: FileInspection;
  result: InspectionResult;
  onAction: (id: NextActionId, fileName: string) => void;
  acknowledged?: boolean;
  onAcknowledgeChange?: (v: boolean) => void;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

export const SummaryBoxes: React.FC<Props> = ({ inspection, result, onAction, acknowledged = false, onAcknowledgeChange }) => {
  const { summary, rows, filename } = inspection;
  const skipped = rows.skipped.filter(s => s.count > 0);
  const skippedTotal = skipped.reduce((n, s) => n + s.count, 0);
  const canShowSkipped = inspection.next_actions.some(a => a.id === 'show_skipped_rows');
  const sellExpectation = result.expectations.find(e => e.rule === 'every_sell_has_earlier_buy' && !e.passed);
  const sells = sellExpectation ? sellExpectation.details.filter(d => d.filename === filename) : [];

  return (
    <div className="row g-3 mb-3">
      <div className="col-md-6">
        <div className="border border-success rounded p-3 h-100">
          <h3 className="h6"><span aria-hidden="true">{'✅'} </span>What we can see</h3>
          <p className="mb-0">
            {plural(summary.buys + summary.sells, 'trade')} ({plural(summary.buys, 'buy')}, {plural(summary.sells, 'sell')})<br />
            {plural(summary.tickers.length, 'ticker')}, {plural(summary.currencies.length, 'currency').replace('currencys', 'currencies')}<br />
            {summary.first_date && summary.last_date && <>Dates: {summary.first_date} {'→'} {summary.last_date}<br /></>}
            {summary.tax_years.length > 0 && <>Covers tax years {summary.tax_years.join(', ')}</>}
          </p>
        </div>
      </div>
      <div className="col-md-6">
        <div className="border border-warning rounded p-3 h-100">
          <h3 className="h6"><span aria-hidden="true">{'⚠️'} </span>What we cannot see</h3>
          {skippedTotal > 0 && (
            <div className="mb-2">
              {plural(skippedTotal, 'row')} skipped:
              <ul className="mb-1">
                {skipped.map(s => <li key={s.reason}>{s.reason}: {s.count}</li>)}
              </ul>
              {canShowSkipped && (
                <button type="button" className="btn btn-sm btn-outline-primary"
                  onClick={() => onAction('show_skipped_rows', filename)}>
                  {ACTION_LABELS.show_skipped_rows}
                </button>
              )}
            </div>
          )}
          {summary.first_date && (
            <p className="mb-0">
              <strong>No buys before {summary.first_date}.</strong> If you owned shares earlier, the Section 104
              pool starts too low and gains will be overstated.
            </p>
          )}
        </div>
      </div>
      {sellExpectation && sells.length > 0 && (
        <div className="col-12">
          <div className="border border-primary rounded p-3" data-testid="sell-without-buy">
            <h3 className="h6"><span aria-hidden="true">{'🎯'} </span>What we expect from a good file</h3>
            <p className="mb-1">
              Every sell needs a buy before it. We found <strong>{plural(sells.length, 'sell')} with no earlier buy</strong>:
            </p>
            <ul>
              {sells.map((s, i) => (
                <li key={`${s.symbol}-${s.date}-${i}`}>
                  <code>{s.symbol}</code> on {s.date}, {s.quantity} shares
                </li>
              ))}
            </ul>
            <p>
              The Section 104 pool for these tickers is missing those shares and their cost, so the allowable cost is
              understated (possibly zero) and the calculated gain is overstated, possibly the whole proceeds taken as gain.
            </p>
            <div className="d-flex flex-wrap gap-2 mb-2">
              <button type="button" className="btn btn-sm btn-primary" onClick={() => onAction('add_earlier_file', filename)}>
                {ACTION_LABELS.add_earlier_file}
              </button>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onAction('add_opening_holdings', filename)}>
                {ACTION_LABELS.add_opening_holdings}
              </button>
            </div>
            {result.requires_acknowledgement && (
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id={`ack-${filename}`} checked={acknowledged}
                  onChange={e => onAcknowledgeChange?.(e.target.checked)} />
                <label className="form-check-label" htmlFor={`ack-${filename}`}>I understand my history is incomplete</label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryBoxes;
