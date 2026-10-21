import { getApiBase } from './apiBase';
import type { InspectionResult } from '../types/inspection';

export class CSVValidationError extends Error {
  missing_columns: string[];
  required_columns: string[];

  constructor(message: string, missing: string[], required: string[]) {
    super(message);
    this.name = 'CSVValidationError';
    this.missing_columns = missing;
    this.required_columns = required;
  }
}

export class BrokerDetectionError extends Error {
  supported_brokers: string[];

  constructor(message: string, supported: string[]) {
    super(message);
    this.name = 'BrokerDetectionError';
    this.supported_brokers = supported;
  }
}

// Types for broker detection
export interface TransactionPreview {
  date: string;
  symbol: string;
  type: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface BrokerDetectionResult {
  detected: boolean;
  broker?: string;
  confidence?: number;
  filename?: string;
  file_type?: string;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    row_count: number;
  };
  metadata?: {
    transaction_count: number;
    date_range: {
      start: string;
      end: string;
    } | null;
    transaction_preview: TransactionPreview[];
  };
  alternatives?: Array<{
    broker: string;
    confidence: number;
  }>;
  error?: string;
  supported_brokers?: string[];
}

export interface BrokerMetadata {
  broker: string;
  confidence: number;
  transaction_count: number;
  date_range: {
    start: string;
    end: string;
  } | null;
}

/**
 * Detect broker from uploaded file without performing full calculation.
 * This provides a preview of the file contents and validation.
 */
export async function detectBroker(file: File): Promise<BrokerDetectionResult> {
  // Use /api prefix which is proxied in development, or full URL in production
  const base = getApiBase();
  const form = new FormData();
  form.append('file', file);

  const resp = await fetch(base + '/detect-broker', {
    method: 'POST',
    body: form
  });

  const result = await resp.json();

  if (!resp.ok) {
    if (result.error && result.supported_brokers) {
      throw new BrokerDetectionError(
        result.message || result.error,
        result.supported_brokers
      );
    }
    throw new Error(result.error || result.message || 'Broker detection failed');
  }

  return result;
}

export async function submitCalculation({
  files,
  taxYear,
  analysisType
}: {
  files: File[];
  taxYear: string;
  analysisType: string;
}) {
  const base = getApiBase();
  const form = new FormData();

  // Append each file with a unique field name (file0, file1, etc.)
  files.forEach((file, index) => {
    form.append(`file${index}`, file);
  });

  form.append('tax_year', taxYear);
  form.append('analysis_type', analysisType);
  const resp = await fetch(base + '/calculate', { method: 'POST', body: form });
  if (!resp.ok) {
    let msg = 'HTTP ' + resp.status;
    try {
      const j = await resp.json();
      if (j.error) msg = j.error;

      // Handle broker detection errors
      if (resp.status === 400 && j.error === 'Broker detection failed' && j.supported_brokers) {
        throw new BrokerDetectionError(
          j.message || 'Could not detect broker from file',
          j.supported_brokers
        );
      }

      // Handle CSV validation errors
      if (resp.status === 400 && j.missing_columns && j.required_columns) {
        throw new CSVValidationError(
          j.message || 'Invalid CSV format',
          j.missing_columns,
          j.required_columns
        );
      }
    } catch (err) {
      if (err instanceof CSVValidationError || err instanceof BrokerDetectionError) {
        throw err;
      }
    }
    throw new Error(msg);
  }
  const raw = await resp.json();
  return { raw };
}

export async function submitUnrealisedGains({
  file,
  taxYear,
  alreadyRealisedGainGbp = 0,
}: {
  file: File;
  taxYear: string;
  alreadyRealisedGainGbp?: number;
}): Promise<{ raw: any }> {
  const base = getApiBase();
  const form = new FormData();
  form.append('file', file);
  form.append('tax_year', taxYear);
  if (alreadyRealisedGainGbp !== 0) {
    form.append('already_realised_gain_gbp', String(alreadyRealisedGainGbp));
  }
  const resp = await fetch(base + '/unrealised-gains', { method: 'POST', body: form });
  if (!resp.ok) {
    let msg = 'HTTP ' + resp.status;
    try {
      const j = await resp.json();
      if (j.error) msg = j.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(msg);
  }
  const raw = await resp.json();
  return { raw };
}

export type InspectErrorKind = 'too_large' | 'server' | 'network';

export class InspectError extends Error {
  kind: InspectErrorKind;
  /** HTTP status when the server answered (undefined for network errors). */
  status?: number;

  constructor(kind: InspectErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'InspectError';
    this.kind = kind;
    this.status = status;
  }
}

// API Gateway rejects bodies above ~6 MB before our handler runs (non-JSON response).
const GATEWAY_LIMIT_BYTES = 5 * 1024 * 1024;

/** Inspection must never hold up the user: give up after this long (cold Lambda, dropped connection). */
export const INSPECT_TIMEOUT_MS = 20_000;

/** Inspect one or more broker files without running a calculation. */
export async function inspectFiles(files: File[]): Promise<InspectionResult> {
  const form = new FormData();
  files.forEach((file, index) => form.append(`file${index}`, file));
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller?.abort();
      reject(new InspectError('network', 'The check took too long. Try again, or continue without it.'));
    }, INSPECT_TIMEOUT_MS);
  });

  let resp: Response;
  let body: any = null;
  try {
    try {
      resp = await Promise.race([
        fetch(getApiBase() + '/inspect-file', { method: 'POST', body: form, signal: controller?.signal }),
        timeout,
      ]);
    } catch (err) {
      if (err instanceof InspectError) throw err;
      throw new InspectError('network', 'We could not reach the server. Check your connection and try again.');
    }
    try {
      body = await Promise.race([resp.json(), timeout]);
    } catch (err) {
      if (err instanceof InspectError) throw err;
      body = null;
    }
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    if (body === null && totalBytes >= GATEWAY_LIMIT_BYTES) {
      throw new InspectError('too_large', 'Those files are too large to check together. Upload fewer or smaller files.', resp.status);
    }
    const msg = body && typeof body.error === 'string' ? body.error : 'The server could not check your files (HTTP ' + resp.status + ').';
    throw new InspectError('server', msg, resp.status);
  }
  if (body === null) {
    throw new InspectError('server', 'The server returned an unreadable response.', resp.status);
  }
  return body as InspectionResult;
}
