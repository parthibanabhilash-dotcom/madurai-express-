import { db } from '@/lib/db';
import { readImage } from '@/lib/storage';
import { session } from '@/lib/auth';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await db.image.findUnique({ where: { id } });
  if (!image) return new Response('Not found', { status: 404 });
  const publicItem = await db.menuItem.findFirst({
    where: { imageId: id, published: true, demo: false },
  });
  if (!image.gallery && !publicItem && !(await session()))
    return new Response('Not found', { status: 404 });
  try {
    const file = await readImage(image.key);
    return new Response(new Uint8Array(await file.Body!.transformToByteArray()).buffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Image unavailable', { status: 503 });
  }
}
