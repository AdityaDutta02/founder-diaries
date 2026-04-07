// jest.setup.ts
// Set test env vars so env.ts validation doesn't throw during tests
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_APP_ENV = 'development';

import '@testing-library/jest-native/extend-expect';
