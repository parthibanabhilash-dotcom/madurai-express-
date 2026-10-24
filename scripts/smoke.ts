export {};
const base = process.env.TEST_URL ?? 'http://localhost:3000';
for (const path of [
  '/',
  '/menu',
  '/about',
  '/gallery',
  '/contact',
  '/sitemap.xml',
  '/robots.txt',
]) {
  const r = await fetch(base + path);
  if (r.status !== 200) throw new Error(`${path}: HTTP ${r.status}`);
  const text = await r.text();
  if (['/', '/menu', '/about', '/gallery', '/contact'].includes(path)) {
    if (!text.includes('MADURAI EXPRESS')) throw new Error('New restaurant branding missing');
    if (/MADURAI MASS|Madurai Mass|madurai-mass|9790599489/.test(text))
      throw new Error('Previous restaurant details remain');
  }
  if (path === '/contact' && !text.includes('tel:+919342328311'))
    throw new Error('Missing call link');
  if (path === '/robots.txt' && !text.includes('/admin'))
    throw new Error('Missing admin robots exclusion');
  if (
    process.env.EXPECT_PRODUCTION === 'true' &&
    ['/', '/menu', '/gallery'].includes(path) &&
    (text.includes('LOCAL DEMONSTRATION') ||
      text.includes('demo-biryani.jpg') ||
      text.includes('Unconfirmed demo'))
  )
    throw new Error('Demo content leaked in production');
  console.log(`PASS ${path}`);
}
const admin = await fetch(base + '/admin', { redirect: 'manual' });
if (admin.status !== 307 || !admin.headers.get('location')?.includes('/admin/login'))
  throw new Error('Admin route is not protected');
console.log('PASS anonymous admin redirect');
