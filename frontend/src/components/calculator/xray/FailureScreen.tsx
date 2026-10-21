import React from 'react';
import type { FileInspection, NextActionId } from '../../../types/inspection';
import type { PrecheckResult } from '../../../utils/filePrecheck';
import { ProgressStrip } from './ProgressStrip';
import { NextActions, withActions } from './NextActions';

export type FailureKind = 'wrong_type' | 'empty' | 'too_large' | 'unsupported_format' | 'no_trades' | 'unknown' | 'blocked';

interface Props {
  kind: FailureKind;
  inspection?: FileInspection;
  precheck?: PrecheckResult;
  fileName?: string;
  onAction: (id: NextActionId, fileName: string) => void;
}

const TITLES: Record<FailureKind, string> = {
  wrong_type: 'That is not a CSV or QFX file',
  empty: 'That file is empty',
  too_large: 'That file is too large',
  unsupported_format: 'We recognise this file, but it is the wrong report',
  no_trades: 'We cannot see any trades in this file',
  unknown: 'We could not recognise this file',
  blocked: 'We recognise this file, but cannot read it yet',
};

const REQUIRED: Partial<Record<FailureKind, NextActionId[]>> = {
  unsupported_format: ['view_export_steps', 'request_support'],
  unknown: ['pick_broker', 'request_support'],
  blocked: ['view_export_steps'],
};

export const FailureScreen: React.FC<Props> = ({ kind, inspection, precheck, fileName, onAction }) => {
  const name = inspection?.filename ?? fileName ?? '';
  const isStep = (w: string) => /^Step \d+:/.test(w);
  const steps = (inspection?.warnings ?? []).filter(isStep).map(w => w.replace(/^Step \d+:\s*/, ''));
  const messages = (inspection?.warnings ?? []).filter(w => !isStep(w));
  const guesses = (inspection?.columns ?? []).filter(c => c.mapped_to);
  const blockedCols = (inspection?.columns ?? []).filter(c => c.status === 'blocked');
  const actions = withActions(inspection?.next_actions ?? [], REQUIRED[kind] ?? []);

  return (
    <div className="card border-danger mb-3" role="alert">
      <div className="card-body">
        {inspection && <ProgressStrip inspection={inspection} />}
        <h2 className="h5">{TITLES[kind]}</h2>
        {name && <p className="text-muted small">{name}{inspection?.format ? ` (${inspection.format.name})` : ''}</p>}
        {precheck && !precheck.ok && <p>{precheck.message}</p>}
        {messages.map((m, i) => <p key={i}>{m}</p>)}

        {kind === 'unsupported_format' && (
          <div className="row g-3">
            <div className="col-md-6">
              <h3 className="h6">What we need</h3>
              <p className="xray-mono">Date/Time &middot; Symbol &middot; Buy/Sell &middot; Quantity &middot; Price &middot; Currency &middot; Commission</p>
            </div>
            {steps.length > 0 && (
              <div className="col-md-6" data-testid="export-steps">
                <h3 className="h6">How to export it</h3>
                <ol>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              </div>
            )}
          </div>
        )}
        {kind === 'unknown' && guesses.length > 0 && (
          <div>
            <h3 className="h6">Our best guesses</h3>
            <ul>{guesses.map(c => <li key={c.header}><code>{c.header}</code> looks like {c.mapped_to}</li>)}</ul>
          </div>
        )}
        {kind === 'blocked' && blockedCols.length > 0 && (
          <div>
            <h3 className="h6">Columns we could not use</h3>
            <ul>{blockedCols.map(c => <li key={c.header}><code>{c.header}</code>{c.note ? `: ${c.note}` : ''}</li>)}</ul>
          </div>
        )}
        <NextActions actions={actions} fileName={name} onAction={onAction} />
      </div>
    </div>
  );
};

export default FailureScreen;
