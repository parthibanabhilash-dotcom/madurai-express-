import 'dotenv/config';
import { db } from '../lib/db';
import { categoryPhotoId, menuPhotos } from '../lib/menu-photos';

async function main() {
  if (!/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL ?? ''))
    throw new Error('Configure DATABASE_URL with your PostgreSQL connection URL privately.');
  const apply = process.argv.includes('--apply');
  await db.$transaction(
    async (tx) => {
      const drafts = await tx.menuItem.findMany({
        where: { published: false },
        include: { category: true },
      });
      console.log(
        `${drafts.length} drafts ${apply ? 'will be published' : 'found (preview only)'}.`,
      );
      console.log(
        'Prices, dietary classifications, availability and existing photos are preserved.',
      );
      console.log('Missing photos use labelled illustrative stock, not actual restaurant dishes.');
      if (!apply) return;
      for (const id of Object.keys(menuPhotos)) {
        await tx.image.upsert({
          where: { id },
          create: {
            id,
            key: `builtin/${id}`,
            alt: 'Illustrative stock food photo; not the actual dish',
            caption: 'Illustrative stock photograph. Source and license: README.md.',
            group: 'Food',
            gallery: false,
          },
          update: {},
        });
      }
      for (const item of drafts) {
        await tx.menuItem.update({
          where: { id: item.id },
          data: {
            published: true,
            demo: false,
            imageId: item.imageId ?? categoryPhotoId(item.category.name),
            ...(item.description ===
            'Suggested example only. Menu, classification and availability need owner confirmation.'
              ? {
                  description:
                    'Please call the restaurant to confirm preparation and availability.',
                }
              : {}),
          },
        });
      }
      console.log(`Published ${drafts.length} items. Previously published items were unchanged.`);
    },
    { timeout: 60000 },
  );
}
main()
  .catch(() => {
    console.error(
      'Publishing failed. Check DATABASE_URL, database access and migrations. No connection secrets logged.',
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
