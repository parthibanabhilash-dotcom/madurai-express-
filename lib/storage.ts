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
  const Body = await validatedImage(file);
  const key = `uploads/${randomUUID()}.webp`;
  await s3().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body, ContentType: 'image/webp' }),
  );
  return key;
}
export async function readImage(key: string) {
  return s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
}
export async function setupBucket() {
  try {
    await s3().send(new HeadBucketCommand({ Bucket: bucket() }));
  } catch {
    await s3().send(new CreateBucketCommand({ Bucket: bucket() }));
  }
}
