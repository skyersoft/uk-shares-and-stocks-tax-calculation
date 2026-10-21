/**
 * Mirrors backend MAX_INSPECT_BYTES (4 MiB, deployment/lambda_handler.py). It only decides whether
 * we CALL /inspect-file: files beyond this budget are shown as "not checked", never blocked.
 */
export const MAX_INSPECT_BYTES = 4 * 1024 * 1024;

/**
 * Hard ceiling for one /calculate request (all files together); above it the upload is blocked.
 *
 * Arithmetic: API Gateway proxies to a synchronous Lambda invocation, whose whole JSON event is
 * limited to 6 MB (6,291,456 bytes). The REST API has no binary_media_types, so the multipart body
 * arrives as a UTF-8 string inside that JSON and grows when escaped (each CRLF becomes 4 characters,
 * each double quote 2). 5 MiB = 5,242,880 bytes leaves 1,048,576 bytes (20%) for that escaping plus
 * headers and multipart framing; quote-heavy broker CSVs inflate by roughly 3-20%. The old 10 MB
 * per-file UI cap was never really reachable: anything much above ~5.5 MB failed at the Lambda.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type PrecheckResult =
  | { ok: true }
  | { ok: false; kind: 'wrong_type' | 'empty' | 'too_large'; message: string };

const SIGNATURES: Array<{ bytes: number[]; label: string }> = [
  { bytes: [0x25, 0x50, 0x44, 0x46], label: 'a PDF' }, // %PDF
  { bytes: [0x7b, 0x5c, 0x72, 0x74, 0x66], label: 'an RTF document' }, // {\rtf
  { bytes: [0x50, 0x4b, 0x03, 0x04], label: 'a ZIP or Excel/Word file' }, // PK\x03\x04
  { bytes: [0xd0, 0xcf, 0x11, 0xe0], label: 'an old Office file' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], label: 'an image' }, // PNG
  { bytes: [0xff, 0xd8, 0xff], label: 'an image' }, // JPEG
  { bytes: [0x47, 0x49, 0x46, 0x38], label: 'an image' }, // GIF
];

async function readHead(file: File, n: number): Promise<Uint8Array> {
  const blob = file.slice(0, n);
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Cheap browser-side check before upload. UTF-16 BOM text (FF FE / FE FF) is accepted
 * as text; the backend decides whether it can parse it.
 */
export async function precheckFile(file: File): Promise<PrecheckResult> {
  if (file.size === 0) {
    return {
      ok: false,
      kind: 'empty',
      message: 'That file is empty. Export it again from your broker and make sure it contains your trades.',
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      kind: 'too_large',
      message: 'That file is over 5 MB, which is more than we can calculate at once. Export a shorter period or split it into several files.',
    };
  }
  let head: Uint8Array;
  try {
    head = await readHead(file, 8);
  } catch {
    return { ok: true }; // cannot read locally; let the server decide
  }
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((b, i) => head[i] === b)) {
      return {
        ok: false,
        kind: 'wrong_type',
        message: `That looks like ${sig.label}. We need the CSV or QFX export from your broker.`,
      };
    }
  }
  return { ok: true };
}
