import { InputError } from './errors';
import { cookies, headers } from 'next/headers';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from './db';
import { redirect } from 'next/navigation';
export const token = () => randomBytes(32).toString('hex');
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export async function session() {
  const raw = (await cookies()).get('mm_session')?.value;
  if (!raw) return null;
  return db.session.findFirst({ where: { id: hash(raw), expiresAt: { gt: new Date() } } });
}
export async function requireAdmin() {
  const s = await session();
  if (!s) redirect('/admin/login');
  return s;
}
export async function checkMutation(form: FormData) {
  const s = await session();
  if (!s) throw new InputError('Please sign in again to continue.');
  await checkOrigin();
  const csrf = String(form.get('csrf') ?? '');
  if (
    Buffer.byteLength(csrf) !== Buffer.byteLength(s.csrf) ||
    !timingSafeEqual(Buffer.from(csrf), Buffer.from(s.csrf))
  )
    throw new InputError('Invalid request token. Refresh and try again.');
  return s;
}
export async function checkOrigin() {
  const h = await headers();
  if (h.get('origin') !== new URL(process.env.APP_URL ?? 'http://localhost:3000').origin)
    throw new InputError('Request origin rejected');
}
export async function consumeLoginAttempt(key: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))::text`;
    const count = await tx.loginAttempt.count({
      where: { key, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
    });
    if (count >= 5) return false;
    await tx.loginAttempt.create({ data: { key } });
    return true;
  });
}
