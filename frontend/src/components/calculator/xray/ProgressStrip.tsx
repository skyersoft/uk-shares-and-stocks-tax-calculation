import React from 'react';
import type { FileInspection } from '../../../types/inspection';
import './xray.css';

type StageState = 'done' | 'current' | 'failed' | 'pending';
interface Stage { name: string; state: StageState; detail: string }

const SYMBOL: Record<StageState, string> = { done: '✓', current: '!', failed: '✗', pending: '…' };
const STATE_WORD: Record<StageState, string> = { done: 'done', current: 'needs a look', failed: 'failed', pending: 'waiting' };

export function computeStages(ins: FileInspection): Stage[] {
  const v = ins.verdict;
  const stopped = v === 'unsupported_format' || v === 'unknown' || v === 'blocked';
  const understood = ins.columns.filter(c => c.status === 'understood').length;
  const total = ins.columns.length;

  const format: Stage = ins.format
    ? { name: 'Format', state: 'done',
        detail: `${ins.format.name}${ins.format.confidence ? ` (${Math.round(ins.format.confidence * 100)}% sure)` : ''}` }
    : { name: 'Format', state: 'failed', detail: 'unknown broker' };

  let columns: Stage;
  if (v === 'unsupported_format') columns = { name: 'Columns', state: 'failed', detail: 'not a trade list' };
  else if (v === 'unknown' || v === 'blocked') columns = { name: 'Columns', state: 'failed', detail: 'cannot match required columns' };
  else if (total === 0) columns = { name: 'Columns', state: 'done', detail: 'read' };
  else columns = { name: 'Columns', state: understood === total ? 'done' : 'current', detail: `${understood} of ${total} understood` };

  let rows: Stage;
  if (stopped) rows = { name: 'Rows', state: 'pending', detail: 'n/a' };
  else if (v === 'no_trades') rows = { name: 'Rows', state: 'failed', detail: 'no trades found' };
  else rows = { name: 'Rows', state: ins.rows.usable < ins.rows.total ? 'current' : 'done',
    detail: `${ins.rows.usable} of ${ins.rows.total} usable` };

  let ready: Stage;
  if (v === 'ready') ready = { name: 'Ready?', state: 'done', detail: 'Yes' };
  else if (v === 'ready_with_warnings') {
    const n = ins.warnings.length;
    ready = { name: 'Ready?', state: 'current', detail: n > 0 ? `Yes, with ${n} warning${n === 1 ? '' : 's'}` : 'Yes, with warnings' };
  } else ready = { name: 'Ready?', state: 'failed', detail: v === 'unsupported_format' ? 'No, different export needed' : 'No' };

  return [format, columns, rows, ready];
}

export const ProgressStrip: React.FC<{ inspection: FileInspection }> = ({ inspection }) => (
  <ol className="xray-strip" aria-label="Checks on this file">
    {computeStages(inspection).map((s, i) => (
      <li key={s.name} className="xray-step" data-state={s.state}>
        <div>{i + 1}. {s.name} <span aria-hidden="true">{SYMBOL[s.state]}</span></div>
        <strong>{s.detail}</strong>
        <span className="visually-hidden"> ({STATE_WORD[s.state]})</span>
      </li>
    ))}
  </ol>
);

export default ProgressStrip;
