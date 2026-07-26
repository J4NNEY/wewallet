import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  noteSchema,
  shoppingItemSchema,
  financeRecordSchema,
} from './index';

describe('loginSchema', () => {
  it('validates correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('validates correct register data', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: '12345',
      confirmPassword: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('noteSchema', () => {
  it('validates correct note data', () => {
    const result = noteSchema.safeParse({
      title: 'My Note',
      content: 'Some content',
      category: 'Pribadi',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = noteSchema.safeParse({
      title: '',
      content: 'Some content',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional content', () => {
    const result = noteSchema.safeParse({
      title: 'My Note',
    });
    expect(result.success).toBe(true);
  });
});

describe('shoppingItemSchema', () => {
  it('validates correct item data', () => {
    const result = shoppingItemSchema.safeParse({
      item_name: 'Beras',
      quantity: 5,
      unit: 'kg',
      estimated_price: 50000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero quantity', () => {
    const result = shoppingItemSchema.safeParse({
      item_name: 'Beras',
      quantity: 0,
      unit: 'kg',
      estimated_price: 50000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = shoppingItemSchema.safeParse({
      item_name: 'Beras',
      quantity: 5,
      unit: 'kg',
      estimated_price: -1000,
    });
    expect(result.success).toBe(false);
  });
});

describe('financeRecordSchema', () => {
  it('validates correct income data', () => {
    const result = financeRecordSchema.safeParse({
      type: 'income',
      category: 'Gaji',
      amount: 5000000,
      transaction_date: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('validates correct expense data', () => {
    const result = financeRecordSchema.safeParse({
      type: 'expense',
      category: 'Makan',
      amount: 50000,
      transaction_date: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = financeRecordSchema.safeParse({
      type: 'invalid',
      category: 'Gaji',
      amount: 5000000,
      transaction_date: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = financeRecordSchema.safeParse({
      type: 'income',
      category: 'Gaji',
      amount: 0,
      transaction_date: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });
});
