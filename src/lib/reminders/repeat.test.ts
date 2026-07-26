import { describe, it, expect } from 'vitest';
import { getNextDueDate, isDueToday, isOverdue, formatRelativeTime } from './repeat';

describe('getNextDueDate', () => {
  it('returns next day for daily repeat', () => {
    const current = '2024-01-15T09:00:00Z';
    const result = getNextDueDate(current, 'daily');
    expect(result.getDate()).toBe(16);
  });

  it('returns next week for weekly repeat', () => {
    const current = '2024-01-15T09:00:00Z';
    const result = getNextDueDate(current, 'weekly');
    expect(result.getDate()).toBe(22);
  });

  it('returns next month for monthly repeat', () => {
    const current = '2024-01-15T09:00:00Z';
    const result = getNextDueDate(current, 'monthly');
    expect(result.getMonth()).toBe(1); // February (0-indexed)
    expect(result.getDate()).toBe(15);
  });

  it('returns same date for none repeat', () => {
    const current = '2024-01-15T09:00:00Z';
    const result = getNextDueDate(current, 'none');
    expect(result.getDate()).toBe(15);
  });
});

describe('isDueToday', () => {
  it('returns true for today date', () => {
    const today = new Date().toISOString();
    expect(isDueToday(today)).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isDueToday(yesterday.toISOString())).toBe(false);
  });
});

describe('isOverdue', () => {
  it('returns true for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isOverdue(past.toISOString())).toBe(true);
  });

  it('returns false for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(isOverdue(future.toISOString())).toBe(false);
  });
});

describe('formatRelativeTime', () => {
  it('returns minutes for near future', () => {
    const future = new Date();
    future.setMinutes(future.getMinutes() + 30);
    const result = formatRelativeTime(future.toISOString());
    expect(result).toContain('menit lagi');
  });

  it('returns hours for same day', () => {
    const future = new Date();
    future.setHours(future.getHours() + 3);
    const result = formatRelativeTime(future.toISOString());
    expect(result).toContain('jam lagi');
  });

  it('returns Besok for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0); // Set to end of tomorrow to ensure > 24h
    const result = formatRelativeTime(tomorrow.toISOString());
    expect(result).toBe('Besok');
  });

  it('returns Terlewat for past', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const result = formatRelativeTime(past.toISOString());
    expect(result).toBe('Terlewat');
  });
});
