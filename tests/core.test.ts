import { describe, it, expect } from 'vitest';
import { demoDishes, filterDishes, activeOffer, categories } from '../lib/content';
import { menuSchema, validateOffer, hoursSchema, safeUrl } from '../lib/validation';
import { validatedImage } from '../lib/storage';
import sharp from 'sharp';
describe('menu search and filters', () => {
  it('searches names without case sensitivity', () =>
    expect(filterDishes(demoDishes, '  mUtToN ', '', '')).toHaveLength(6));
  it('combines category and classification', () => {
    expect(filterDishes(demoDishes, '', 'Dosai', 'NON_VEG')).toHaveLength(3);
    expect(filterDishes(demoDishes, '', 'Dosai', 'VEG')).toHaveLength(7);
  });
  it('supports resetting filters', () =>
    expect(filterDishes(demoDishes, '', '', '')).toHaveLength(60));
  it('provides ten unique unconfirmed examples in every category', () => {
    expect(new Set(demoDishes.map((d) => d.id)).size).toBe(60);
    expect(new Set(demoDishes.map((d) => d.name)).size).toBe(60);
    for (const category of categories)
      expect(filterDishes(demoDishes, '', category, '')).toHaveLength(10);
    expect(demoDishes.every((d) => d.demo && !d.available && d.price === null)).toBe(true);
    expect(demoDishes.filter((d) => d.featured)).toHaveLength(3);
  });
  it('preserves original draft IDs when expanding the catalog', () => {
    expect(demoDishes.find((d) => d.name === 'Mutton Biryani')?.id).toBe('demo-0');
    expect(demoDishes.find((d) => d.name === 'Garlic Chicken Gravy')?.id).toBe('demo-7');
  });
  it('rejects demo publication and negative prices', () => {
    const d = { ...demoDishes[0], categoryId: 'c', published: true };
    expect(menuSchema.safeParse(d).success).toBe(false);
    expect(menuSchema.safeParse({ ...d, demo: false, price: -1 }).success).toBe(false);
  });
});
describe('offers', () => {
  const now = new Date('2026-10-24T10:00:00Z');
  it('includes exact start, excludes exact expiry', () => {
    expect(activeOffer({ published: true, startsAt: now, endsAt: new Date(+now + 1) }, now)).toBe(
      true,
    );
    expect(activeOffer({ published: true, startsAt: new Date(+now - 1), endsAt: now }, now)).toBe(
      false,
    );
  });
  it('hides unpublished and future offers', () => {
    expect(activeOffer({ published: false, startsAt: now, endsAt: new Date(+now + 1) }, now)).toBe(
      false,
    );
    expect(
      activeOffer(
        { published: true, startsAt: new Date(+now + 1), endsAt: new Date(+now + 2) },
        now,
      ),
    ).toBe(false);
  });
  it('converts IST input to UTC and rejects invalid intervals', () => {
    expect(validateOffer('2026-10-24T15:30', '2026-10-24T16:30').startsAt.toISOString()).toBe(
      now.toISOString(),
    );
    expect(() => validateOffer('2026-10-25T10:00', '2026-10-24T10:00')).toThrow();
  });
});
describe('settings', () => {
  it('rejects unsafe URLs', () => {
    expect(safeUrl.safeParse('javascript:alert(1)').success).toBe(false);
    expect(safeUrl.safeParse('http://example.com').success).toBe(false);
  });
  it('requires a complete unique week', () =>
    expect(hoursSchema.safeParse([]).success).toBe(false));
});
describe('uploads', () => {
  it('rejects SVG, oversized and disguised files', async () => {
    await expect(
      validatedImage(new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' })),
    ).rejects.toThrow();
    await expect(
      validatedImage(new File([new Uint8Array(6 * 1024 * 1024)], 'x.png', { type: 'image/png' })),
    ).rejects.toThrow();
    await expect(
      validatedImage(new File(['not a png'], 'x.png', { type: 'image/png' })),
    ).rejects.toThrow();
  });
  it('re-encodes valid images and rejects tiny images', async () => {
    const png = await sharp({
      create: { width: 120, height: 120, channels: 3, background: 'green' },
    })
      .png()
      .toBuffer();
    const result = await validatedImage(
      new File([new Uint8Array(png)], 'image.png', { type: 'image/png' }),
    );
    expect((await sharp(result).metadata()).format).toBe('webp');
    const tiny = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'red' } })
      .png()
      .toBuffer();
    await expect(
      validatedImage(new File([new Uint8Array(tiny)], 'tiny.png', { type: 'image/png' })),
    ).rejects.toThrow();
  });
});
