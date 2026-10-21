import React from 'react';
import type { NextAction, NextActionId } from '../../../types/inspection';

export const ACTION_LABELS: Record<NextActionId, string> = {
  add_earlier_file: 'Add another file',
  add_opening_holdings: 'Add opening holdings',
  show_skipped_rows: 'Show skipped rows',
  view_export_steps: 'How to export this file',
  pick_broker: 'Pick my broker instead',
  request_support: 'Ask us to add support',
  remove_file: 'Remove file',
};

/**
 * Actions the backend may emit that the UI cannot carry out yet, so they are never rendered.
 * pick_broker: follow-up is a broker override sent to /calculate and /inspect-file; until then
 * picking a broker changes nothing and would be a dead end.
 */
export const UNAVAILABLE_ACTIONS: NextActionId[] = ['pick_broker'];

const PRIMARY: NextActionId[] = ['add_earlier_file', 'view_export_steps', 'pick_broker'];

/** Merge backend actions with required defaults; remove_file is always present and last. */
export function withActions(actions: NextAction[], required: NextActionId[] = []): NextAction[] {
  const out: NextAction[] = [];
  const seen = new Set<NextActionId>();
  const push = (a: NextAction) => { if (!seen.has(a.id)) { seen.add(a.id); out.push(a); } };
  actions.filter(a => a.id !== 'remove_file').forEach(push);
  required.filter(id => id !== 'remove_file').forEach(id => push({ id, label: ACTION_LABELS[id] }));
  push(actions.find(a => a.id === 'remove_file') ?? { id: 'remove_file', label: ACTION_LABELS.remove_file });
  return out;
}

interface Props {
  actions: NextAction[];
  fileName: string;
  onAction: (id: NextActionId, fileName: string) => void;
  exclude?: NextActionId[];
}

export const NextActions: React.FC<Props> = ({ actions, fileName, onAction, exclude = [] }) => (
  <div className="d-flex flex-wrap gap-2 mt-2">
    {withActions(actions).filter(a => !exclude.includes(a.id) && !UNAVAILABLE_ACTIONS.includes(a.id)).map(a => (
      <button key={a.id} type="button"
        className={`btn btn-sm ${PRIMARY.includes(a.id) ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => onAction(a.id, fileName)}>
        {a.label}
      </button>
    ))}
  </div>
);

export default NextActions;
