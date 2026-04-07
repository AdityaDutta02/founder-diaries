// __tests__/hooks/useDiaryEntry.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useDiaryEntry } from '@/hooks/useDiaryEntry';

// Mock SQLite
const mockRunAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/sqlite', () => ({
  getDatabase: () => ({ runAsync: mockRunAsync }),
}));

// Mock sync service
jest.mock('@/services/syncService', () => ({
  addToSyncQueue: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-1234'),
}));

// Mock auth store — authenticated user
jest.mock('@/stores/authStore', () => {
  const authState = { session: { user: { id: 'user-123' } } };
  return {
    useAuthStore: (selector?: (s: typeof authState) => unknown) =>
      selector ? selector(authState) : authState,
  };
});

// Mock diary store
jest.mock('@/stores/diaryStore', () => {
  const addEntry = jest.fn();
  const storeState = {
    selectedDate: '2026-04-07',
    getEntriesForDate: () => [],
    getEntryDates: () => new Set(),
    addEntry,
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    entries: new Map(),
  };
  return {
    __mockAddEntry: addEntry,
    useDiaryStore: (selector?: (s: unknown) => unknown) =>
      selector ? selector(storeState) : storeState,
  };
});

// Retrieve the mock after jest.mock is processed
const mockAddEntry: jest.Mock = (require('@/stores/diaryStore') as { __mockAddEntry: jest.Mock }).__mockAddEntry;


describe('useDiaryEntry.createEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes entry to SQLite diary_entries table', async () => {
    const { result } = renderHook(() => useDiaryEntry());

    await act(async () => {
      await result.current.createEntry({
        entry_date: '2026-04-07',
        text_content: 'Today I shipped the MVP',
        mood: 'Shipped It',
      });
    });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO diary_entries'),
      expect.arrayContaining(['test-uuid-1234', '2026-04-07', 'Today I shipped the MVP']),
    );
  });

  it('writes images to SQLite diary_images table when provided', async () => {
    const { result } = renderHook(() => useDiaryEntry());

    await act(async () => {
      await result.current.createEntry({
        entry_date: '2026-04-07',
        text_content: 'Entry with image',
        images: [{ local_id: 'img-1', local_uri: 'file:///path/to/image.jpg' }],
      });
    });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO diary_images'),
      expect.arrayContaining(['img-1', 'test-uuid-1234', 'file:///path/to/image.jpg']),
    );
  });

  it('adds upload_image to sync queue for each image', async () => {
    const { addToSyncQueue } = require('@/services/syncService');
    const { result } = renderHook(() => useDiaryEntry());

    await act(async () => {
      await result.current.createEntry({
        entry_date: '2026-04-07',
        text_content: 'Entry with image',
        images: [{ local_id: 'img-1', local_uri: 'file:///path/to/image.jpg' }],
      });
    });

    expect(addToSyncQueue).toHaveBeenCalledWith('upload_image', expect.objectContaining({
      imageLocalUri: 'file:///path/to/image.jpg',
      localImageId: 'img-1',
    }));
  });

  it('works with no images (backwards compatible)', async () => {
    const { result } = renderHook(() => useDiaryEntry());

    await act(async () => {
      await result.current.createEntry({
        entry_date: '2026-04-07',
        text_content: 'Text only entry',
      });
    });

    expect(mockAddEntry).toHaveBeenCalled();
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO diary_entries'),
      expect.anything(),
    );
  });
});
