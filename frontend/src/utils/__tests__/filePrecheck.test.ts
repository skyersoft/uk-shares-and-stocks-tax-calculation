import { precheckFile, MAX_UPLOAD_BYTES, MAX_INSPECT_BYTES } from '../filePrecheck';

const mk = (bytes: number[] | string, name: string) => {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : new Uint8Array(bytes);
  const file = new File([data], name);
  // jsdom's Blob has no arrayBuffer() and jest.setup.ts mocks FileReader, so stub slice().
  Object.defineProperty(file, 'slice', {
    value: (start: number, end: number) => ({
      arrayBuffer: async () => data.slice(start, end).buffer,
    }),
  });
  return file;
};
const pad = (b: number[]) => [...b, 0, 0, 0, 0, 0, 0];

describe('precheckFile', () => {
  it.each([
    ['PDF', pad([0x25, 0x50, 0x44, 0x46]), 'a.csv', /PDF/],
    ['RTF', '{\\rtf1\\ansi hello', 'a.csv', /RTF/],
    ['ZIP', pad([0x50, 0x4b, 0x03, 0x04]), 'a.zip', /ZIP/],
    ['XLSX', pad([0x50, 0x4b, 0x03, 0x04]), 'trades.xlsx', /Excel/],
    ['legacy office', pad([0xd0, 0xcf, 0x11, 0xe0]), 'a.xls', /Office/],
    ['PNG', pad([0x89, 0x50, 0x4e, 0x47]), 'a.csv', /image/],
    ['JPEG', pad([0xff, 0xd8, 0xff, 0xe0]), 'a.csv', /image/],
    ['GIF', pad([0x47, 0x49, 0x46, 0x38]), 'a.csv', /image/],
  ])('rejects %s', async (_n, bytes, name, re) => {
    const r = await precheckFile(mk(bytes as any, name));
    expect(r).toMatchObject({ ok: false, kind: 'wrong_type' });
    expect((r as any).message).toMatch(re);
    expect((r as any).message).toMatch(/CSV or QFX/);
  });

  it('rejects empty files', async () => {
    expect(await precheckFile(new File([], 'a.csv'))).toMatchObject({ ok: false, kind: 'empty' });
  });

  it('rejects oversize files', async () => {
    const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'a.csv');
    expect(await precheckFile(big)).toMatchObject({ ok: false, kind: 'too_large' });
  });

  it('hard limit is the /calculate ceiling, above the 4 MiB inspect budget', () => {
    expect(MAX_INSPECT_BYTES).toBe(4 * 1024 * 1024);
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024);
  });

  it('accepts a file over the inspect budget but under the hard limit', async () => {
    const f = mk('Date,Symbol\n', 'a.csv');
    Object.defineProperty(f, 'size', { value: MAX_INSPECT_BYTES + 1 });
    expect(await precheckFile(f)).toEqual({ ok: true });
  });

  it('accepts normal CSV', async () => {
    expect(await precheckFile(mk('Date,Symbol,Qty\n2024-01-01,AAPL,1\n', 'a.csv'))).toEqual({ ok: true });
  });

  it('accepts CSV with UTF-8 BOM', async () => {
    expect(await precheckFile(mk([0xef, 0xbb, 0xbf, 0x44, 0x61, 0x74, 0x65], 'a.csv'))).toEqual({ ok: true });
  });

  it('accepts UTF-16 BOM text', async () => {
    expect(await precheckFile(mk([0xff, 0xfe, 0x44, 0x00], 'a.csv'))).toEqual({ ok: true });
  });

  it('accepts .qfx', async () => {
    expect(await precheckFile(mk('OFXHEADER:100\n<OFX></OFX>', 'a.qfx'))).toEqual({ ok: true });
  });
});
