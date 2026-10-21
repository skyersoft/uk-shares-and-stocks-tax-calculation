import { inspectFiles, InspectError } from '../api';

jest.mock('../apiBase', () => ({ getApiBase: () => '/api' }));

const okBody = { files: [], expectations: [], can_continue: true, requires_acknowledgement: false };
const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);
const mockFetch = (impl: any) => {
  (global as any).fetch = jest.fn(impl);
  return (global as any).fetch as jest.Mock;
};
const resp = (status: number, json: any | Error) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => {
    if (json instanceof Error) throw json;
    return json;
  },
});

describe('inspectFiles', () => {
  it('posts file0.. to /inspect-file and returns parsed JSON', async () => {
    const f = mockFetch(async () => resp(200, okBody));
    const out = await inspectFiles([file('a.csv'), file('b.csv')]);
    expect(out).toEqual(okBody);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('/api/inspect-file');
    expect(init.method).toBe('POST');
    const form = init.body as FormData;
    expect((form.get('file0') as File).name).toBe('a.csv');
    expect((form.get('file1') as File).name).toBe('b.csv');
  });

  it('throws server InspectError with message for 413 JSON', async () => {
    mockFetch(async () => resp(413, { error: 'Too big' }));
    await expect(inspectFiles([file('a.csv')])).rejects.toMatchObject({ kind: 'server', message: 'Too big', status: 413 });
  });

  it('exposes the HTTP status on server errors', async () => {
    mockFetch(async () => resp(500, { error: 'Oops' }));
    await expect(inspectFiles([file('a.csv')])).rejects.toMatchObject({ kind: 'server', status: 500 });
  });

  it('maps non-JSON failure on a large payload to too_large', async () => {
    mockFetch(async () => resp(413, new Error('not json')));
    const p = inspectFiles([file('a.csv', 5.5 * 1024 * 1024)]);
    await expect(p).rejects.toBeInstanceOf(InspectError);
    await expect(p).rejects.toMatchObject({ kind: 'too_large' });
  });

  it('maps non-JSON 502 on small payload to server', async () => {
    mockFetch(async () => resp(502, new Error('not json')));
    await expect(inspectFiles([file('a.csv')])).rejects.toMatchObject({ kind: 'server' });
  });

  it('maps fetch rejection to network', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(inspectFiles([file('a.csv')])).rejects.toMatchObject({ kind: 'network' });
  });
});
