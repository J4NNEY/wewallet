import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate } from '../utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional')).toBe('base conditional');
    expect(cn('base', false && 'conditional')).toBe('base');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });
});

describe('formatCurrency', () => {
  it('formats number to IDR currency', () => {
    const result = formatCurrency(100000);
    expect(result).toContain('100.000');
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('formats large numbers', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1.000.000');
  });
});

describe('formatDate', () => {
  it('formats date string correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('15');
    expect(result).toContain('Januari');
    expect(result).toContain('2024');
  });

  it('formats Date object correctly', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('Januari');
  });
});
