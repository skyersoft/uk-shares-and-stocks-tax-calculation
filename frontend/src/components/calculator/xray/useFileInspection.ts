import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { inspectFiles, InspectError } from '../../../services/api';
import { precheckFile, MAX_UPLOAD_BYTES } from '../../../utils/filePrecheck';
import type { PrecheckResult } from '../../../utils/filePrecheck';
import { trackInspection } from '../../../utils/analytics';
import type { FileInspection, InspectionResult, Verdict } from '../../../types/inspection';

export type FailedPrecheck = Extract<PrecheckResult, { ok: false }>;

/** What the upload step knows about one file. */
export type FileCheck =
  | { status: 'precheck' }
  | { status: 'failed_precheck'; precheck: FailedPrecheck }
  | { status: 'inspecting' }
  | { status: 'inspected'; inspection: FileInspection }
  | { status: 'error' };

/** Summary the wizard uses to enable or disable Continue. */
export interface UploadGate {
  blockedReason: string | null;
  requiresAck: boolean;
}

export interface InspectableFile {
  id: string;
  file: File;
}

const ALLOWED_EXTENSIONS = ['.csv', '.qfx', '.ofx'];
const DEBOUNCE_MS = 150;
export const BAD_VERDICTS: Verdict[] = ['blocked', 'unsupported_format', 'no_trades', 'unknown'];

const TOTAL_TOO_LARGE: FailedPrecheck = {
  ok: false,
  kind: 'too_large',
  message: 'Together your files are over 4 MB, which is more than we can check at once. Export a shorter date range for this file, or remove another file.',
};

const REQUEST_TOO_LARGE: FailedPrecheck = {
  ok: false,
  kind: 'too_large',
  message: 'These files are too large to check together. Export a shorter date range, or remove a file and try again.',
};

function extensionPrecheck(file: File): FailedPrecheck | null {
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (ALLOWED_EXTENSIONS.includes(ext)) return null;
  return {
    ok: false,
    kind: 'wrong_type',
    message: `"${file.name}" is not a CSV or QFX file. We need the CSV or QFX export from your broker.`,
  };
}

const isTooLarge = (e: unknown) => e instanceof InspectError && (e.kind === 'too_large' || e.status === 413);

interface Outcome {
  key: string;
  result?: InspectionResult;
  error?: InspectError | Error;
}

/**
 * Prechecks each file in the browser, then inspects all passing files together on the server
 * whenever the list changes. Stale responses are ignored.
 */
export function useFileInspection(files: InspectableFile[]) {
  const [prechecks, setPrechecks] = useState<Record<string, PrecheckResult>>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestId = useRef(0);
  const started = useRef<Set<string>>(new Set());

  const idKey = files.map(f => f.id).join('|');

  // Browser prechecks: run once per file id.
  useEffect(() => {
    files.forEach(({ id, file }) => {
      if (started.current.has(id)) return;
      started.current.add(id);
      const ext = extensionPrecheck(file);
      if (ext) {
        setPrechecks(p => ({ ...p, [id]: ext }));
        return;
      }
      precheckFile(file)
        .catch((): PrecheckResult => ({ ok: true }))
        .then(r => setPrechecks(p => ({ ...p, [id]: r })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey]);

  const prechecksDone = files.every(f => prechecks[f.id] !== undefined);

  // Decide which files to send, applying the total-size guard in list order.
  const { sendable, overTotal } = useMemo(() => {
    const send: InspectableFile[] = [];
    const over = new Set<string>();
    let total = 0;
    files.forEach(f => {
      if (!prechecks[f.id]?.ok) return;
      if (total + f.file.size > MAX_UPLOAD_BYTES) {
        over.add(f.id);
      } else {
        total += f.file.size;
        send.push(f);
      }
    });
    return { sendable: send, overTotal: over };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey, prechecks]);

  const sendKey = sendable.map(f => f.id).join('|');
  const requestKey = prechecksDone ? `${sendKey}#${attempt}` : null;

  useEffect(() => {
    if (requestKey === null || sendable.length === 0) return;
    const id = ++requestId.current;
    const toSend = sendable;
    const timer = setTimeout(() => {
      inspectFiles(toSend.map(f => f.file))
        .then(result => {
          if (id !== requestId.current) return;
          result.files.forEach(ins => trackInspection(ins.verdict, ins.format?.id ?? null, toSend.length));
          setOutcome({ key: requestKey, result });
        })
        .catch(error => {
          if (id !== requestId.current) return;
          setOutcome({ key: requestKey, error });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      // Invalidate this request so a late response (after unmount or a list change) is ignored
      requestId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const current = outcome && outcome.key === requestKey ? outcome : null;
  const result = current?.result ?? null;
  const tooLarge = !!current?.error && isTooLarge(current.error);
  const serviceError = current?.error && !tooLarge ? current.error : null;
  const inFlight = !prechecksDone || (sendable.length > 0 && !current);

  const checks: Record<string, FileCheck> = {};
  files.forEach(f => {
    const pre = prechecks[f.id];
    if (!pre) checks[f.id] = { status: 'precheck' };
    else if (!pre.ok) checks[f.id] = { status: 'failed_precheck', precheck: pre };
    else if (overTotal.has(f.id)) checks[f.id] = { status: 'failed_precheck', precheck: TOTAL_TOO_LARGE };
    else if (!current) checks[f.id] = { status: 'inspecting' };
    else if (tooLarge) checks[f.id] = { status: 'failed_precheck', precheck: REQUEST_TOO_LARGE };
    else if (serviceError) checks[f.id] = { status: 'error' };
    else {
      const index = sendable.findIndex(s => s.id === f.id);
      const inspection = result?.files[index];
      checks[f.id] = inspection ? { status: 'inspected', inspection } : { status: 'error' };
    }
  });

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  return { checks, result, inFlight, serviceError, retry };
}

/** Pure gate computation so the wizard can enable or disable Continue. */
export function computeUploadGate(
  files: InspectableFile[],
  checks: Record<string, FileCheck>,
  result: InspectionResult | null,
  inFlight: boolean,
): UploadGate {
  for (const f of files) {
    const c = checks[f.id];
    const bad = c?.status === 'failed_precheck' || (c?.status === 'inspected' && BAD_VERDICTS.includes(c.inspection.verdict));
    if (bad) return { blockedReason: `Fix or remove file ${f.file.name} to continue`, requiresAck: false };
  }
  if (inFlight) return { blockedReason: 'Checking your files…', requiresAck: false };
  return { blockedReason: null, requiresAck: !!result?.requires_acknowledgement };
}
