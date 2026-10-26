import 'dotenv/config';
import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { hash as passwordHash } from 'bcryptjs';
const runtime = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  origin: 'http://localhost:3000',
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (k: string) => (runtime.cookies.has(k) ? { value: runtime.cookies.get(k) } : undefined),
    set: (k: string, v: string) => runtime.cookies.set(k, v),
    delete: (k: string) => runtime.cookies.delete(k),
  }),
  headers: async () => ({ get: (k: string) => (k === 'origin' ? runtime.origin : null) }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error('REDIRECT:' + url);
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const enabled = !!process.env.TEST_DATABASE_URL;
describe.skipIf(!enabled)('PostgreSQL-backed admin workflows', () => {
  let db: typeof import('../lib/db').db;
  let actions: typeof import('../app/admin/actions');
  let auth: typeof import('../lib/auth');
  const email = `integration-${randomUUID()}@example.test`;
  const categoryName = `Integration ${randomUUID()}`;
  const password = 'Test-only!' + randomUUID();
  let adminId = '',
    categoryId = '',
    itemId = '',
    offerId = '';
  let rawSession = '';
  const form = (action: string, data: Record<string, string> = {}) => {
    const f = new FormData();
    f.set('action', action);
    f.set('csrf', 'integration-csrf');
    for (const [k, v] of Object.entries(data)) f.set(k, v);
    return f;
  };
  beforeAll(async () => {
    if (!new URL(process.env.TEST_DATABASE_URL!).pathname.endsWith('_test'))
      throw new Error('TEST_DATABASE_URL must name a dedicated database ending in _test.');
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.APP_URL = 'http://localhost:3000';
    db = (await import('../lib/db')).db;
    actions = await import('../app/admin/actions');
    auth = await import('../lib/auth');
    const a = await db.admin.create({
      data: { email, passwordHash: await passwordHash(password, 12) },
    });
    adminId = a.id;
    rawSession = auth.token();
    await db.session.create({
      data: {
        id: auth.hash(rawSession),
        adminId,
        csrf: 'integration-csrf',
        expiresAt: new Date(Date.now() + 600000),
      },
    });
  });
  beforeEach(() => {
    runtime.cookies.clear();
    runtime.cookies.set('mm_session', rawSession);
    runtime.origin = 'http://localhost:3000';
  });
  afterAll(async () => {
    if (!db) return;
    await db.menuItem.deleteMany({ where: { category: { name: categoryName } } });
    await db.category.deleteMany({ where: { name: categoryName } });
    if (offerId) await db.offer.deleteMany({ where: { id: offerId } });
    await db.loginAttempt.deleteMany({ where: { key: auth.hash(email) } });
    if (adminId) await db.admin.delete({ where: { id: adminId } });
    await db.$disconnect();
  });
  it('rejects unauthorized mutations', async () => {
    runtime.cookies.clear();
    expect((await actions.mutate({}, form('category', { name: categoryName }))).error).toContain(
      'sign in again',
    );
    expect(await db.category.count({ where: { name: categoryName } })).toBe(0);
  });
  it('rejects CSRF and cross-origin mutations', async () => {
    const f = form('category', { name: categoryName });
    f.set('csrf', 'wrong');
    expect((await actions.mutate({}, f)).error).toContain('token');
    runtime.origin = 'https://attacker.example';
    expect((await actions.mutate({}, form('category', { name: categoryName }))).error).toContain(
      'origin',
    );
  });
  it('creates category and draft, updates price and publishes, protects referenced category, deletes dish', async () => {
    expect(
      (await actions.mutate({}, form('category', { name: categoryName }))).success,
    ).toBeTruthy();
    categoryId = (await db.category.findUniqueOrThrow({ where: { name: categoryName } })).id;
    const fields = {
      name: 'Integration dish',
      description: 'Fixture',
      categoryId,
      kind: 'VEG',
      price: '125.50',
    };
    expect((await actions.mutate({}, form('item', fields))).success).toBeTruthy();
    const item = await db.menuItem.findFirstOrThrow({ where: { categoryId } });
    itemId = item.id;
    expect(item.price).toBe(12550);
    expect(item.published).toBe(false);
    expect(
      (
        await actions.mutate(
          {},
          form('item', {
            ...fields,
            id: itemId,
            published: 'on',
            available: 'on',
            featured: 'on',
            price: '',
          }),
        )
      ).success,
    ).toBeTruthy();
    const updated = await db.menuItem.findUniqueOrThrow({ where: { id: itemId } });
    expect(updated.price).toBeNull();
    expect(updated.published && updated.available && updated.featured).toBe(true);
    expect((await actions.mutate({}, form('delete-category', { id: categoryId }))).error).toContain(
      'Move or delete',
    );
    expect(
      (
        await actions.mutate(
          {},
          form('item', { ...fields, id: itemId, demo: 'on', published: 'on' }),
        )
      ).error,
    ).toContain('drafts');
    expect((await actions.mutate({}, form('delete-item', { id: itemId }))).success).toBeTruthy();
    expect(await db.menuItem.findUnique({ where: { id: itemId } })).toBeNull();
  });
  it('persists scheduled offers and deletes them', async () => {
    const title = 'Integration ' + randomUUID();
    expect(
      (
        await actions.mutate(
          {},
          form('offer', {
            title,
            description: 'Test offer',
            startsAt: '2026-10-24T10:00',
            endsAt: '2026-10-24T12:00',
            published: 'on',
          }),
        )
      ).success,
    ).toBeTruthy();
    const o = await db.offer.findFirstOrThrow({ where: { title } });
    offerId = o.id;
    expect(o.startsAt.toISOString()).toBe('2026-10-24T04:30:00.000Z');
    expect((await actions.mutate({}, form('delete-offer', { id: offerId }))).success).toBeTruthy();
  });
  it('validates and persists business settings without fabricated hours', async () => {
    const previous = await db.settings.findUnique({ where: { id: 'business' } });
    const r = await actions.mutate(
      {},
      form('settings', {
        phone: '+919342328311',
        address: 'Avaniyapuram, Madurai',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Avaniyapuram',
        orderUrl: '',
        hours: '',
      }),
    );
    expect(r.success).toBeTruthy();
    const s = await db.settings.findUniqueOrThrow({ where: { id: 'business' } });
    expect(s.whatsappEnabled).toBe(false);
    expect(s.addressConfirmed).toBe(false);
    expect(s.hours).toEqual([]);
    expect(s.orderUrl).toBe('');
    if (previous) {
      const { id, ...data } = previous;
      await db.settings.update({ where: { id }, data: { ...data, hours: previous.hours ?? [] } });
    } else await db.settings.delete({ where: { id: 'business' } });
  });
  it('rejects malformed uploads before storage access', async () => {
    const f = form('upload', { alt: 'Test image', group: 'Food' });
    f.set('file', new File(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' }));
    expect((await actions.mutate({}, f)).error).toContain('JPEG');
  });
  it.skipIf(process.env.TEST_S3 !== 'true')(
    'uploads, retrieves and manages gallery images through S3',
    async () => {
      const sharp = (await import('sharp')).default;
      const storage = await import('../lib/storage');
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const alt = 'Integration photo ' + randomUUID();
      const image = await sharp({
        create: { width: 200, height: 150, channels: 3, background: 'green' },
      })
        .png()
        .toBuffer();
      const f = form('upload', { alt, caption: 'Fixture', group: 'Food' });
      f.set('file', new File([new Uint8Array(image)], 'fixture.png', { type: 'image/png' }));
      expect((await actions.mutate({}, f)).success).toBeTruthy();
      const record = await db.image.findFirstOrThrow({ where: { alt } });
      try {
        const object = await storage.readImage(record.key);
        const bytes = await object.Body!.transformToByteArray();
        expect((await sharp(bytes).metadata()).format).toBe('webp');
        runtime.cookies.clear();
        const { GET } = await import('../app/api/images/[id]/route');
        const params = Promise.resolve({ id: record.id });
        expect(
          (await GET(new Request('http://localhost/api/images/' + record.id), { params })).status,
        ).toBe(404);
        runtime.cookies.set('mm_session', rawSession);
        expect(
          (
            await actions.mutate(
              {},
              form('image', {
                id: record.id,
                alt,
                caption: 'Updated caption',
                group: 'Restaurant',
                gallery: 'on',
              }),
            )
          ).success,
        ).toBeTruthy();
        runtime.cookies.clear();
        const publicResponse = await GET(new Request('http://localhost/api/images/' + record.id), {
          params,
        });
        expect(publicResponse.status).toBe(200);
        expect(publicResponse.headers.get('Content-Type')).toBe('image/webp');
        runtime.cookies.set('mm_session', rawSession);
        expect(
          (await actions.mutate({}, form('delete-image', { id: record.id }))).success,
        ).toBeTruthy();
      } finally {
        await db.image.deleteMany({ where: { id: record.id } });
        await storage
          .s3()
          .send(new DeleteObjectCommand({ Bucket: storage.bucket(), Key: record.key }));
      }
    },
  );
  it.skipIf(process.env.TEST_S3 !== 'true')(
    'uploads a device photo directly with a dish and preserves it on later saves',
    async () => {
      const sharp = (await import('sharp')).default;
      const storage = await import('../lib/storage');
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const bytes = await sharp({
        create: { width: 180, height: 180, channels: 3, background: 'red' },
      })
        .png()
        .toBuffer();
      const fields = { name: 'Device upload test', description: '', categoryId, kind: 'VEG' };
      const f = form('item', fields);
      f.set('dishPhoto', new File([new Uint8Array(bytes)], 'dish.png', { type: 'image/png' }));
      expect((await actions.mutate({}, f)).success).toBeTruthy();
      const item = await db.menuItem.findFirstOrThrow({ where: { name: fields.name, categoryId } });
      const image = await db.image.findUniqueOrThrow({ where: { id: item.imageId! } });
      try {
        expect(image.alt).toBe(fields.name);
        expect(image.gallery).toBe(false);
        const object = await storage.readImage(image.key);
        expect((await sharp(await object.Body!.transformToByteArray()).metadata()).format).toBe(
          'webp',
        );
        const bad = form('item', {
          ...fields,
          id: item.id,
          imageId: image.id,
          name: 'Should not save',
        });
        bad.set('dishPhoto', new File(['bad'], 'bad.png', { type: 'image/png' }));
        expect((await actions.mutate({}, bad)).error).toContain('Invalid image');
        expect((await db.menuItem.findUniqueOrThrow({ where: { id: item.id } })).name).toBe(
          fields.name,
        );
        expect(
          (await actions.mutate({}, form('item', { ...fields, id: item.id, imageId: image.id })))
            .success,
        ).toBeTruthy();
        expect((await db.menuItem.findUniqueOrThrow({ where: { id: item.id } })).imageId).toBe(
          image.id,
        );
      } finally {
        await db.menuItem.delete({ where: { id: item.id } });
        await db.image.delete({ where: { id: image.id } });
        await storage
          .s3()
          .send(new DeleteObjectCommand({ Bucket: storage.bucket(), Key: image.key }));
      }
    },
  );
  it('authenticates, creates opaque session, logs out and rejects expired session', async () => {
    runtime.cookies.set('mm_login_csrf', 'login-csrf');
    const f = form('', { email, password, csrf: 'login-csrf' });
    await expect(actions.login({}, f)).rejects.toThrow('REDIRECT:/admin');
    const raw = runtime.cookies.get('mm_session')!;
    expect(raw).toHaveLength(64);
    expect(await db.session.findUnique({ where: { id: auth.hash(raw) } })).not.toBeNull();
    const s = await auth.session();
    const out = form('logout', { csrf: s!.csrf });
    expect((await actions.mutate({}, out)).success).toBeTruthy();
    expect(runtime.cookies.has('mm_session')).toBe(false);
    await db.session.update({
      where: { id: auth.hash(rawSession) },
      data: { expiresAt: new Date(0) },
    });
    runtime.cookies.set('mm_session', rawSession);
    expect(await auth.session()).toBeNull();
  });
  it('rate-limits repeated login attempts', async () => {
    runtime.cookies.set('mm_login_csrf', 'login-csrf');
    await db.loginAttempt.deleteMany({ where: { key: auth.hash(email) } });
    for (let i = 0; i < 5; i++)
      expect(
        (await actions.login({}, form('', { email, password: 'incorrect', csrf: 'login-csrf' })))
          .error,
      ).toContain('incorrect');
    expect(
      (await actions.login({}, form('', { email, password, csrf: 'login-csrf' }))).error,
    ).toContain('Too many');
  });
});
