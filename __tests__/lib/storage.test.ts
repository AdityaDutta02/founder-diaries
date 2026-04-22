// Mock expo-secure-store with an in-memory implementation
const store: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { store[key] = value; }),
  deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
}));

import { storageAdapter } from '@/lib/storage';

describe('storageAdapter', () => {
  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
  });

  it('stores and retrieves a value', async () => {
    await storageAdapter.setItem('test-key', 'test-value');
    const result = await storageAdapter.getItem('test-key');
    expect(result).toBe('test-value');
  });

  it('returns null for missing key', async () => {
    const result = await storageAdapter.getItem('nonexistent');
    expect(result).toBeNull();
  });

  it('removes a value', async () => {
    await storageAdapter.setItem('remove-key', 'value');
    await storageAdapter.removeItem('remove-key');
    const result = await storageAdapter.getItem('remove-key');
    expect(result).toBeNull();
  });
});
