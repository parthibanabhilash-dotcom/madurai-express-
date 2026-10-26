import { cache } from 'react';
import type { Category, Image, Offer } from '@prisma/client';
import { defaultSettings, demoDishes, demoEnabled, type Dish } from './content';
function unavailableData() {
  const demo = demoEnabled();
  return {
    settings: defaultSettings,
    categories: [] as Category[],
    items: (demo ? demoDishes : []) as Dish[],
    images: [] as Image[],
    offers: [] as Offer[],
    demo,
    unavailable: true,
  };
}
export const publicData = cache(async function publicData() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('[public-data] DATABASE_URL_MISSING: configure hosted PostgreSQL.');
    return unavailableData();
  }
  try {
    const { db } = await import('./db');
    const [settings, categories, items, images, offers] = await Promise.all([
      db.settings.findUnique({ where: { id: 'business' } }),
      db.category.findMany({ orderBy: { name: 'asc' } }),
      db.menuItem.findMany({
        where: { published: true, demo: false },
        include: { category: true },
      }),
      db.image.findMany({ where: { gallery: true }, orderBy: { createdAt: 'desc' } }),
      db.offer.findMany({
        where: { published: true, startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
      }),
    ]);
    return {
      settings: settings ?? defaultSettings,
      categories,
      items: demoEnabled() && items.length === 0 ? demoDishes : items,
      images,
      offers,
      demo: demoEnabled(),
      unavailable: false,
    };
  } catch (error) {
    // Log only a code/name: Prisma messages can contain connection information.
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : error instanceof Error
          ? error.name
          : 'UNKNOWN';
    console.error('[public-data] Database query failed. Check connection and migrations.', {
      code,
    });
    return unavailableData();
  }
});
