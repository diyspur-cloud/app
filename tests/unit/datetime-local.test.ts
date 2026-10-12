import { describe, it, expect } from 'vitest';
import { toLocalDateTime } from '@/components/admin/admin-controls';

describe('Admin datetime-local timezone conversion (QA-13)', () => {
  it('returns empty string for null, undefined, or invalid string', () => {
    expect(toLocalDateTime(null)).toBe('');
    expect(toLocalDateTime(undefined)).toBe('');
    expect(toLocalDateTime('')).toBe('');
    expect(toLocalDateTime('invalid-date')).toBe('');
  });

  it('formats a date to YYYY-MM-DDTHH:mm using local calendar parts', () => {
    // Create a specific local date
    const localDate = new Date(2026, 9, 12, 14, 30); // 2026-10-12 14:30 local
    const isoString = localDate.toISOString();

    const result = toLocalDateTime(isoString);
    expect(result).toBe('2026-10-12T14:30');
  });

  it('preserves round-trip conversion without hourly drift', () => {
    const originalLocal = new Date(2026, 5, 20, 9, 15); // 2026-06-20 09:15 local
    const iso = originalLocal.toISOString();

    const localFormatted = toLocalDateTime(iso);
    expect(localFormatted).toBe('2026-06-20T09:15');

    // Simulate form submission where datetime-local string is parsed back to Date
    const parsedBack = new Date(localFormatted);
    expect(parsedBack.getTime()).toBe(originalLocal.getTime());
    expect(parsedBack.toISOString()).toBe(iso);
  });
});
