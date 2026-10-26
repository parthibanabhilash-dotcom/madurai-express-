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
        description: d.description,
        categoryId: category.id,
        price: null,
        available: false,
        featured: false,
        published: false,
        demo: true,
        kind: d.kind,
      },
      update: {},
    });
  }
  console.log(
    `Seeded ${categories.length} categories and ${demoDishes.length} suggested DRAFT dishes (10 per category). Existing records preserved. No verified menu or prices added.`,
  );
}
main().finally(() => db.$disconnect());
