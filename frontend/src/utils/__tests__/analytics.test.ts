import { trackInspection, trackInspectionAction } from '../analytics';

describe('inspection analytics', () => {
  let gtag: jest.Mock;
  beforeEach(() => {
    gtag = jest.fn();
    (window as any).gtag = gtag;
  });
  afterEach(() => {
    delete (window as any).gtag;
  });

  it('trackInspection sends file_inspection with verdict, format and file count', () => {
    trackInspection('ready_with_warnings', 'trading212', 2);
    expect(gtag).toHaveBeenCalledWith('event', 'file_inspection', {
      verdict: 'ready_with_warnings', format_id: 'trading212', file_count: 2,
    });
  });

  it('trackInspection sends a null format as "none"', () => {
    trackInspection('unknown', null, 1);
    expect(gtag).toHaveBeenCalledWith('event', 'file_inspection', {
      verdict: 'unknown', format_id: 'none', file_count: 1,
    });
  });

  it('trackInspectionAction sends file_inspection_action with action and verdict', () => {
    trackInspectionAction('remove_file', 'blocked');
    expect(gtag).toHaveBeenCalledWith('event', 'file_inspection_action', { action: 'remove_file', verdict: 'blocked' });
  });

  it('does nothing without gtag', () => {
    delete (window as any).gtag;
    expect(() => trackInspection('ready', null, 1)).not.toThrow();
  });
});
