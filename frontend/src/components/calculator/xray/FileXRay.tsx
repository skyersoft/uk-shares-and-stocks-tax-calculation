import React from 'react';
import type { FileInspection, InspectionResult, NextActionId } from '../../../types/inspection';
import { ProgressStrip } from './ProgressStrip';
import { ColumnTable } from './ColumnTable';
import { SummaryBoxes } from './SummaryBoxes';
import { NextActions } from './NextActions';

export interface FileXRayProps {
  inspection: FileInspection;
  /** Position of this file in result.files; sells are matched by it because filenames can repeat */
  fileIndex?: number;
  result: InspectionResult;
  onAction: (id: NextActionId, fileName: string) => void;
  acknowledged?: boolean;
  onAcknowledgeChange?: (v: boolean) => void;
}

export const FileXRay: React.FC<FileXRayProps> = ({ inspection, fileIndex, result, onAction, acknowledged, onAcknowledgeChange }) => (
  <div className="card mb-3">
    <div className="card-body">
      <h2 className="h5 mb-0">{inspection.filename}</h2>
      <ProgressStrip inspection={inspection} />
      {inspection.warnings.length > 0 && (
        <ul className="list-unstyled small text-warning-emphasis mb-2" aria-label="Warnings">
          {inspection.warnings.map((w, i) => (
            <li key={i}><span aria-hidden="true">{'⚠'} </span><span className="visually-hidden">Warning: </span>{w}</li>
          ))}
        </ul>
      )}
      <ColumnTable columns={inspection.columns} />
      <SummaryBoxes inspection={inspection} fileIndex={fileIndex} result={result} onAction={onAction}
        acknowledged={acknowledged} onAcknowledgeChange={onAcknowledgeChange} />
      <NextActions actions={inspection.next_actions} fileName={inspection.filename} onAction={onAction}
        exclude={['add_earlier_file', 'add_opening_holdings', 'show_skipped_rows']} />
    </div>
  </div>
);

export default FileXRay;
