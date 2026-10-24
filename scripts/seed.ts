import 'dotenv/config';
import { db } from '../lib/db';
import { categories, demoDishes } from '../lib/content';
async function main() {
  await db.settings.upsert({ where: { id: 'business' }, create: {}, update: {} });
  for (const name of categories)
    await db.category.upsert({ where: { name }, create: { name }, update: {} });
  for (const d of demoDishes) {
    const category = await db.category.findUniqueOrThrow({ where: { name: d.category.name } });
    await db.menuItem.upsert({
      where: { id: d.id },
      create: {
        id: d.id,
        name: d.name,
        description: 'Owner confirmation required.',
        categoryId: category.id,
        price: null,
        available: false,
        featured: false,
        published: false,
        demo: true,
        kind: 'NON_VEG',
      },
      update: {},
    });
  }
  console.log(
    'Seeded categories, business settings and eight provisional DRAFT dishes. No verified menu or prices added.',
  );
}
main().finally(() => db.$disconnect());
