import { describe, expect, it } from 'vitest';
import { capitalize, formatDuration, localDayRange, toDateTimeInput } from './format';

describe('format helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(250)).toBe('4h 10m');
  });

  it('builds a 24-hour local day range', () => {
    const { departAfter, departBefore } = localDayRange('2026-12-01');
    expect(new Date(departBefore) - new Date(departAfter)).toBe(24 * 3600 * 1000);
    expect(localDayRange('')).toEqual({});
  });

  it('round-trips datetime-local values', () => {
    const local = '2026-12-01T07:30';
    expect(toDateTimeInput(new Date(local))).toBe(local);
  });

  it('capitalizes status labels', () => {
    expect(capitalize('checked_in')).toBe('Checked in');
  });
});
