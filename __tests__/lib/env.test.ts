// __tests__/lib/env.test.ts
describe('ENV', () => {
  it('exports required keys with values from test env vars', () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ENV } = require('@/lib/env') as { ENV: Record<string, string> };
    expect(ENV.SUPABASE_URL).toBe('https://test.supabase.co');
    expect(ENV.SUPABASE_ANON_KEY).toBe('test-anon-key');
    expect(ENV.APP_ENV).toBe('development');
    expect(ENV).toHaveProperty('POSTHOG_API_KEY');
    expect(ENV).toHaveProperty('POSTHOG_HOST');
  });
});
