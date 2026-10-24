import S3rver from 's3rver';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
if (process.env.NODE_ENV === 'production')
  throw new Error(
    'The S3 sandbox is for local development only. Configure durable S3 storage in production.',
  );
const directory = path.resolve('.local/images');
await mkdir(directory, { recursive: true });
const server = new S3rver({
  address: '127.0.0.1',
  port: 9000,
  directory,
  silent: true,
  configureBuckets: [{ name: 'madurai-images', configs: [] }],
});
await server.run();
console.log(
  'Development-only S3 sandbox listening on 127.0.0.1:9000. Use S3RVER for both access and secret keys. Files persist in .local/images. Use MinIO/S3 for production.',
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, async () => {
    await server.close();
    process.exit(0);
  });
