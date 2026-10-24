import { db } from './db';
import { defaultSettings, demoDishes, demoEnabled } from './content';
export async function publicData() {
  try {
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
    };
  } catch (error) {
    if (!demoEnabled()) throw error;
    return {
      settings: defaultSettings,
      categories: [],
      items: demoDishes,
      images: [],
      offers: [],
      demo: true,
    };
  }
}
