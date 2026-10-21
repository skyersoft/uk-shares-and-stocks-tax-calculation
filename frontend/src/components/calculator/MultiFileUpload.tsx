import React, { useState, useRef, useEffect } from 'react';
import { BrokerFile, BrokerType, BROKER_OPTIONS } from '../../types/calculator';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { detectBroker } from '../../services/api';
import { MAX_UPLOAD_BYTES } from '../../utils/filePrecheck';
import { trackInspectionAction } from '../../utils/analytics';
import type { NextActionId } from '../../types/inspection';
import { FeedbackForm } from '../feedback/FeedbackForm';
import { FileXRay } from './xray/FileXRay';
import { FailureScreen, FailureKind } from './xray/FailureScreen';
import { useFileInspection, computeUploadGate, BAD_VERDICTS, FileCheck, UploadGate } from './xray/useFileInspection';

export type { UploadGate } from './xray/useFileInspection';

interface MultiFileUploadProps {
  files: BrokerFile[];
  onChange: (files: BrokerFile[]) => void;
  maxFiles?: number;
  /** Shared "I understand my history is incomplete" flag, owned by the wizard. */
  acknowledged?: boolean;
  onAcknowledgeChange?: (value: boolean) => void;
  /** Reports whether Continue should be allowed. */
  onGateChange?: (gate: UploadGate) => void;
}

const MAX_FILES_DEFAULT = 10;

const BROKER_TYPE_BY_NAME: Record<string, BrokerType> = {
  'Interactive Brokers': 'interactive-brokers',
  'Trading 212': 'trading212',
  'Hargreaves Lansdown': 'hargreaves-lansdown',
  'Freetrade': 'freetrade',
  'Fidelity': 'fidelity',
  'eToro': 'etoro',
  'Vanguard': 'vanguard',
  'AJ Bell': 'aj-bell'
};

const NOTICES: Partial<Record<NextActionId, string>> = {
  add_opening_holdings:
    'Entering opening holdings here is coming soon. For now, add an earlier export from your broker that covers the original purchases.',
  show_skipped_rows:
    'The skipped rows are listed by reason above. A row-by-row view is coming soon.',
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const scrollTo = (el: Element | null) => {
  if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
    (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  files,
  onChange,
  maxFiles = MAX_FILES_DEFAULT,
  acknowledged = false,
  onAcknowledgeChange,
  onGateChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Keep a ref to the latest files to avoid stale closures in async operations
  const filesRef = useRef<BrokerFile[]>(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const { checks, result, inFlight, serviceError, retry } = useFileInspection(files);
  const gate = computeUploadGate(files, checks, result, inFlight);

  useEffect(() => {
    onGateChange?.(gate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate.blockedReason, gate.requiresAck]);

  // Reset the shared acknowledgement when the set of files changes
  const idKey = files.map(f => f.id).join('|');
  const prevIdKey = useRef(idKey);
  useEffect(() => {
    if (prevIdKey.current !== idKey) {
      prevIdKey.current = idKey;
      if (acknowledged) onAcknowledgeChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey]);

  // ...or when a settled result no longer needs it
  useEffect(() => {
    if (!inFlight && !gate.requiresAck && acknowledged) onAcknowledgeChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFlight, gate.requiresAck]);

  // Broker detection pre-fills the broker selector. Only for files that passed the browser precheck.
  const detectStarted = useRef<Set<string>>(new Set());
  useEffect(() => {
    files.forEach(f => {
      const status = checks[f.id]?.status;
      if (f.detectionStatus !== 'pending' || status === 'precheck' || status === 'failed_precheck') return;
      if (detectStarted.current.has(f.id)) return;
      detectStarted.current.add(f.id);
      detectBrokerForFile(f.id, f.file);
    });
  });

  const updateFile = (fileId: string, patch: Partial<BrokerFile>) => {
    onChange(filesRef.current.map(f => (f.id === fileId ? { ...f, ...patch } : f)));
  };

  const detectBrokerForFile = async (fileId: string, file: File) => {
    updateFile(fileId, { detectionStatus: 'detecting' });
    try {
      const detection = await detectBroker(file);
      if (detection.detected) {
        updateFile(fileId, {
          broker: BROKER_TYPE_BY_NAME[detection.broker!] || 'manual-csv',
          detectionStatus: 'detected',
          detectedBroker: detection.broker,
          confidence: detection.confidence,
          transactionCount: detection.metadata?.transaction_count
        });
      } else {
        updateFile(fileId, { detectionStatus: 'error', detectionError: detection.error || 'Could not detect broker' });
      }
    } catch (err) {
      updateFile(fileId, { detectionStatus: 'error', detectionError: err instanceof Error ? err.message : 'Detection failed' });
    }
  };

  const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleFiles = (newFiles: FileList | File[] | null) => {
    if (!newFiles || newFiles.length === 0) return;
    setError(null);

    if (files.length + newFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at a time. Remove a file first, or combine your exports.`);
      return;
    }

    // Type and size problems are shown per file by the X-ray, so every file is added.
    const brokerFiles: BrokerFile[] = Array.from(newFiles).map(file => ({
      id: generateId(),
      file,
      broker: 'interactive-brokers', // default until detection runs
      accountName: undefined,
      detectionStatus: file.name.toLowerCase().endsWith('.csv') ? 'pending' : undefined,
    }));
    onChange([...files, ...brokerFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (fileId: string) => {
    onChange(filesRef.current.filter(f => f.id !== fileId));
    setError(null);
  };

  const handleAction = (action: NextActionId, fileId: string, check: FileCheck | undefined) => {
    if (check?.status === 'inspected') trackInspectionAction(action, check.inspection.verdict);
    setNotice(null);
    switch (action) {
      case 'remove_file':
        handleRemove(fileId);
        break;
      case 'add_earlier_file':
        fileInputRef.current?.click();
        break;
      case 'request_support':
        setShowFeedback(true);
        setTimeout(() => scrollTo(document.getElementById('upload-feedback')), 0);
        break;
      case 'view_export_steps': {
        const steps = document.querySelector(`[data-file-id="${fileId}"] [data-testid="export-steps"]`);
        scrollTo(steps ?? document.getElementById('brokerHelpAccordion'));
        break;
      }
      default:
        setNotice(NOTICES[action] ?? null);
    }
  };

  const renderCheck = (brokerFile: BrokerFile) => {
    const check = checks[brokerFile.id];
    const onAction = (id: NextActionId) => handleAction(id, brokerFile.id, check);
    if (!check || check.status === 'precheck' || check.status === 'inspecting') {
      return (
        <div className="d-flex align-items-center gap-2 text-muted small py-2 placeholder-glow" role="status">
          <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <span>Checking {brokerFile.file.name}…</span>
        </div>
      );
    }
    if (check.status === 'failed_precheck') {
      return <FailureScreen kind={check.precheck.kind} precheck={check.precheck} fileName={brokerFile.file.name} onAction={onAction} />;
    }
    if (check.status === 'error' || !result) return null;
    const { inspection } = check;
    if (BAD_VERDICTS.includes(inspection.verdict)) {
      return <FailureScreen kind={inspection.verdict as FailureKind} inspection={inspection} onAction={onAction} />;
    }
    return (
      <FileXRay inspection={inspection} result={result} onAction={onAction}
        acknowledged={acknowledged} onAcknowledgeChange={onAcknowledgeChange} />
    );
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="multi-file-upload">
      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded p-4 text-center ${dragOver ? 'border-primary bg-light' : 'border-secondary'}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.qfx,.ofx"
          onChange={handleFileInput}
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'none' }}
        />

        <div className="py-3">
          <i className={`fas fa-cloud-upload-alt ${dragOver ? 'text-primary' : 'text-secondary'} mb-3`} style={{ fontSize: '3rem' }}></i>
          <h5 className="mb-2">
            {dragOver ? 'Drop files here' : 'Drag & drop broker files here'}
          </h5>
          <p className="text-muted mb-2">or click to browse</p>
          <p className="small text-muted mb-0">
            Accepted formats: CSV, QFX, OFX | Max {maxFiles} files | Max {formatFileSize(MAX_UPLOAD_BYTES)} in total
          </p>
        </div>
      </div>

      {serviceError && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 mb-0 py-2 small" role="status">
          <span>
            We couldn't check your file just now. You can still continue: we will check it again when we calculate.
          </span>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={retry}>Try again</button>
        </div>
      )}

      {notice && (
        <div className="alert alert-info mt-3 mb-0 py-2 small" role="status">{notice}</div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              <i className="fas fa-file-alt me-2"></i>
              Uploaded Files ({files.length}/{maxFiles})
            </h6>
            <span className="badge bg-secondary">
              Total: {formatFileSize(totalSize)}
            </span>
          </div>

          <div className="list-group">
            {files.map((brokerFile) => (
              <div key={brokerFile.id} className="list-group-item" data-file-id={brokerFile.id}>
                <div className="row g-3 align-items-center mb-2">
                  {/* File Info */}
                  <div className="col-12 col-md-4">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-file-csv text-success me-2" style={{ fontSize: '1.5rem' }}></i>
                      <div className="flex-grow-1">
                        <div className="fw-bold text-truncate" style={{ maxWidth: '200px' }}>
                          {brokerFile.file.name}
                        </div>
                        <div className="small text-muted">{formatFileSize(brokerFile.file.size)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Broker Selection */}
                  <div className="col-12 col-md-3">
                    <select
                      id={`broker-select-${brokerFile.id}`}
                      aria-label={`Broker for ${brokerFile.file.name}`}
                      className="form-select form-select-sm"
                      value={brokerFile.broker}
                      onChange={(e) => updateFile(brokerFile.id, { broker: e.target.value as BrokerType })}
                      disabled={brokerFile.detectionStatus === 'detecting'}
                    >
                      {BROKER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Name (Optional) */}
                  <div className="col-12 col-md-3">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Account label (optional)"
                      aria-label={`Account label for ${brokerFile.file.name}`}
                      value={brokerFile.accountName || ''}
                      onChange={(e) => updateFile(brokerFile.id, { accountName: e.target.value })}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-12 col-md-2 text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemove(brokerFile.id)}
                      aria-label={`Remove ${brokerFile.file.name}`}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </div>

                {renderCheck(brokerFile)}
              </div>
            ))}
          </div>

          <div className="mt-2 text-end">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onChange([])}
            >
              <i className="fas fa-times me-2"></i>
              Clear All
            </Button>
          </div>
        </div>
      )}

      {showFeedback && (
        <div id="upload-feedback">
          <p className="small text-muted mt-3 mb-0">
            Tell us which broker and report this is. Please do not paste account numbers or personal details.
          </p>
          <FeedbackForm />
        </div>
      )}

      {files.length === 0 && (
        <div className="alert alert-info mt-3 mb-0" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Tip:</strong> You can upload files from multiple brokers. We'll combine them automatically.
        </div>
      )}
    </div>
  );
};
