import { formatPayload, hasRequestBody } from '../../pages/Pipelines';

describe('Pipelines execution payload helpers', () => {
  it('returns true for POST-like methods and false otherwise', () => {
    expect(hasRequestBody('POST')).toBe(true);
    expect(hasRequestBody('PUT')).toBe(true);
    expect(hasRequestBody('PATCH')).toBe(true);
    expect(hasRequestBody('GET')).toBe(false);
    expect(hasRequestBody(null)).toBe(false);
  });

  it('formats object payloads as pretty JSON', () => {
    expect(formatPayload({ sent: 1 })).toBe('{\n  "sent": 1\n}');
  });

  it('returns text fallback for empty values', () => {
    expect(formatPayload(null)).toBe('нет данных');
    expect(formatPayload(undefined)).toBe('нет данных');
    expect(formatPayload('')).toBe('нет данных');
  });

  it('keeps string payloads as-is', () => {
    expect(formatPayload('ok')).toBe('ok');
  });
});
