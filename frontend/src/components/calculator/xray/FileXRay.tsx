import React from 'react';
import type { FileInspection, InspectionResult, NextActionId } from '../../../types/inspection';
import { ProgressStrip } from './ProgressStrip';
import { ColumnTable } from './ColumnTable';
import { SummaryBoxes } from './SummaryBoxes';
import { NextActions } from './NextActions';

export interface FileXRayProps {
  inspection: FileInspection;
  result: InspectionResult;
  onAction: (id: NextActionId, fileName: string) => void;
  acknowledged?: boolean;
  onAcknowledgeChange?: (v: boolean) => void;
}

export const FileXRay: React.FC<FileXRayProps> = ({ inspection, result, onAction, acknowledged, onAcknowledgeChange }) => (
  <div className="card mb-3">
    <div className="card-body">
      <h2 className="h5 mb-0">{inspection.filename}</h2>
      <ProgressStrip inspection={inspection} />
      {inspection.warnings.length > 0 && (
        <ul className="small text-muted">{inspection.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
      )}
      <ColumnTable columns={inspection.columns} />
      <SummaryBoxes inspection={inspection} result={result} onAction={onAction}
        acknowledged={acknowledged} onAcknowledgeChange={onAcknowledgeChange} />
      <NextActions actions={inspection.next_actions} fileName={inspection.filename} onAction={onAction}
        exclude={['add_earlier_file', 'add_opening_holdings', 'show_skipped_rows']} />
    </div>
  </div>
);

export default FileXRay;
