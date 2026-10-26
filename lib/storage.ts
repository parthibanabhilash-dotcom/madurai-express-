import { InputError } from './errors';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { db } from './db';
function databaseStorage() {
  if (process.env.IMAGE_STORAGE === 'database') return true;
  if (process.env.IMAGE_STORAGE === 's3') return false;
  return !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY;
}
export const s3 = () =>
  new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.S3_SECRET_KEY ?? '',
    },
  });
export const bucket = () => process.env.S3_BUCKET ?? 'madurai-images';
export async function validatedImage(file: File) {
  if (file.size === 0 || file.size > 5 * 1024 * 1024)
    throw new InputError('Image must be between 1 byte and 5 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new InputError('Upload JPEG, PNG or WebP only.');
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const image = sharp(bytes, { limitInputPixels: 25000000 });
    const meta = await image.metadata();
    if (
      !['jpeg', 'png', 'webp'].includes(meta.format ?? '') ||
      !meta.width ||
      !meta.height ||
      meta.width < 100 ||
      meta.height < 100 ||
      (meta.pages && meta.pages > 1)
    )
      throw new InputError();
    return await image
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new InputError('Invalid image. Use a still JPEG, PNG or WebP at least 100 × 100 pixels.');
  }
}
export async function uploadImage(file: File) {
  let Body = await validatedImage(file);
  if (databaseStorage()) {
    Body = await sharp(Body)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    if (Body.length > 1024 * 1024)
      throw new InputError(
        'Photo is too detailed. Choose a smaller photo (compressed limit 1 MB).',
      );
    const key = `database/${randomUUID()}.webp`;
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(68427391)::text`;
      const usage = await tx.imageObject.aggregate({ _sum: { size: true } });
      if ((usage._sum.size ?? 0) + Body.length > 50 * 1024 * 1024)
        throw new InputError(
          'Photo storage limit reached (50 MB). Remove unused photos or configure S3 storage.',
        );
      await tx.imageObject.create({ data: { key, data: new Uint8Array(Body), size: Body.length } });
    });
    return key;
  }
  const key = `uploads/${randomUUID()}.webp`;
  await s3().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body, ContentType: 'image/webp' }),
  );
  return key;
}
export async function readImage(key: string) {
  if (key.startsWith('database/')) {
    const object = await db.imageObject.findUnique({ where: { key } });
    if (!object) throw new InputError('Image not found');
    return { Body: { transformToByteArray: async () => object.data } };
  }
  return s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
}
export async function setupBucket() {
  try {
    await s3().send(new HeadBucketCommand({ Bucket: bucket() }));
  } catch {
    await s3().send(new CreateBucketCommand({ Bucket: bucket() }));
  }
}
