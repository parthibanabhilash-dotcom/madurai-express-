export function siteUrl() {
  const hosted = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL;
  if (configured) {
    const url = new URL(configured);
    if (!(process.env.VERCEL && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
      return url.origin;
  }
  return hosted ? new URL(`https://${hosted}`).origin : 'http://localhost:3000';
}
