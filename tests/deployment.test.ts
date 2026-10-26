import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const queries = vi.hoisted(() => ({
  settings: { findUnique: vi.fn() },
  category: { findMany: vi.fn() },
  menuItem: { findMany: vi.fn() },
  image: { findMany: vi.fn() },
  offer: { findMany: vi.fn() },
}));
vi.mock('../lib/db', () => ({ db: queries }));
import { publicData } from '../lib/data';
import { defaultSettings } from '../lib/content';
import { siteUrl } from '../lib/site-url';
beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgresql://fixture/database');
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('DEMO_PREVIEW', 'true');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  queries.settings.findUnique.mockResolvedValue({ ...defaultSettings, phone: '+919999999999' });
  for (const q of [queries.category, queries.menuItem, queries.image, queries.offer])
    q.findMany.mockResolvedValue([]);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
describe('production data resilience', () => {
  it('renders known contact facts without querying an unconfigured database', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const result = await publicData();
    expect(result.unavailable).toBe(true);
    expect(result.settings.phone).toBe(defaultSettings.phone);
    expect(result.items).toEqual([]);
    expect(result.demo).toBe(false);
    expect(queries.settings.findUnique).not.toHaveBeenCalled();
  });
  it('does not publish demo dishes, images, offers or hours during a database outage', async () => {
    queries.settings.findUnique.mockRejectedValue({
      code: 'P1001',
      message: 'sensitive connection details',
    });
    const result = await publicData();
    expect(result.unavailable).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.images).toEqual([]);
    expect(result.offers).toEqual([]);
    expect(result.settings.hours).toBeNull();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('sensitive');
  });
  it('preserves database settings when the connection works', async () => {
    const result = await publicData();
    expect(result.unavailable).toBe(false);
    expect(result.settings.phone).toBe('+919999999999');
    expect(result.demo).toBe(false);
  });
  it('retains explicitly labelled demos only in local development', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('NODE_ENV', 'development');
    const result = await publicData();
    expect(result.demo).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });
});
describe('deployment URLs', () => {
  it('prefers the configured production domain', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://restaurant.example/');
    expect(siteUrl()).toBe('https://restaurant.example');
  });
  it('replaces localhost settings with the Vercel production domain', () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'madurai-express.vercel.app');
    expect(siteUrl()).toBe('https://madurai-express.vercel.app');
  });
  it('uses the Vercel deployment URL when no domain is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('APP_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('VERCEL_URL', 'preview.vercel.app');
    expect(siteUrl()).toBe('https://preview.vercel.app');
  });
});
