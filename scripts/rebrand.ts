import 'dotenv/config';
import { db } from '../lib/db';
import { defaultSettings } from '../lib/content';
import { mkdir, writeFile } from 'node:fs/promises';
async function main() {
  const settings = await db.settings.findUnique({ where: { id: 'business' } });
  if (settings?.phone === defaultSettings.phone && !settings.orderUrl) {
    console.log('New restaurant identity is already configured.');
    return;
  }
  const [items, images, offers] = await Promise.all([
    db.menuItem.findMany(),
    db.image.findMany(),
    db.offer.findMany(),
  ]);
  await mkdir('.local/backups', { recursive: true });
  await writeFile(
    `.local/backups/business-before-rebrand-${Date.now()}.json`,
    JSON.stringify({ settings, items, images, offers }, null, 2),
  );
  const { hours, ...defaults } = defaultSettings;
  await db.$transaction([
    db.menuItem.updateMany({ data: { published: false, featured: false } }),
    db.image.updateMany({ data: { gallery: false } }),
    db.offer.updateMany({ data: { published: false } }),
    db.settings.upsert({
      where: { id: 'business' },
      create: { ...defaults, hours: [] },
      update: { ...defaults, hours: [] },
    }),
  ]);
  console.log(
    'Madurai Express identity configured. Prior business records backed up locally and unpublished; administrator accounts preserved.',
  );
}
main().finally(() => db.$disconnect());
