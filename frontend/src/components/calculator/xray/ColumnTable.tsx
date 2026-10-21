import React from 'react';
import type { ColumnInfo, ColumnStatus } from '../../../types/inspection';
import './xray.css';

const MAX_SAMPLES = 3;
const PILL: Record<ColumnStatus, { cls: string; icon: string; text: string }> = {
  understood: { cls: 'bg-success-subtle text-success-emphasis', icon: '✓', text: 'understood' },
  check: { cls: 'bg-warning-subtle text-warning-emphasis', icon: '!', text: 'check' },
  ignored: { cls: 'bg-secondary-subtle text-secondary-emphasis', icon: '–', text: 'ignored' },
  blocked: { cls: 'bg-danger-subtle text-danger-emphasis', icon: '✗', text: 'blocked' },
};

const StatusPill: React.FC<{ col: ColumnInfo }> = ({ col }) => {
  const p = PILL[col.status];
  return (
    <span className={`badge rounded-pill ${p.cls}`}>
      <span aria-hidden="true">{p.icon} </span>{p.text}{col.note ? `: ${col.note}` : ''}
    </span>
  );
};

const FillBar: React.FC<{ col: ColumnInfo }> = ({ col }) => {
  const max = col.filled + col.blank;
  const pct = max > 0 ? Math.round((col.filled / max) * 100) : 0;
  return (
    <>
      <span className="xray-bar" role="progressbar" aria-label={`${col.header} filled`}
        aria-valuenow={col.filled} aria-valuemin={0} aria-valuemax={max}>
        <i className={pct === 100 ? 'good' : 'partial'} style={{ width: `${pct}%` }} />
      </span>{' '}
      <span>{col.filled}</span>
      {col.blank > 0 && <span className="text-muted small"> ({col.blank} blank)</span>}
    </>
  );
};

const samples = (c: ColumnInfo) => c.samples.slice(0, MAX_SAMPLES).join(', ');
const isProblem = (c: ColumnInfo) => c.status === 'check' || c.status === 'blocked';

export const ColumnTable: React.FC<{ columns: ColumnInfo[] }> = ({ columns }) => {
  if (columns.length === 0) return null;
  const sorted = [...columns].sort((a, b) => Number(isProblem(b)) - Number(isProblem(a)));
  return (
    <section className="mb-3">
      <h3 className="h6">Your columns, one by one</h3>
      <div className="d-none d-md-block table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th scope="col">Your header</th>
              <th scope="col">We read it as</th>
              <th scope="col">Filled</th>
              <th scope="col">Sample values</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {columns.map(c => (
              <tr key={c.header}>
                <td><code>{c.header}</code></td>
                <td className="fw-bold">{c.mapped_to ?? 'not needed'}</td>
                <td><FillBar col={c} /></td>
                <td className="xray-mono">{samples(c)}</td>
                <td><StatusPill col={c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-md-none" data-testid="column-cards">
        {sorted.map(c => (
          <div key={c.header} className="card mb-2" data-testid="column-card">
            <div className="card-body py-2">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div><code>{c.header}</code> <span className="text-muted">&rarr;</span> <strong>{c.mapped_to ?? 'not needed'}</strong></div>
                <StatusPill col={c} />
              </div>
              <div className="mt-1"><FillBar col={c} /></div>
              {c.samples.length > 0 && <div className="xray-mono mt-1">{samples(c)}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ColumnTable;
