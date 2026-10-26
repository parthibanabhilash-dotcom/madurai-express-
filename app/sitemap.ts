import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/menu', '/about', '/gallery', '/contact'].map((path) => ({
    url: `${siteUrl()}${path}`,
  }));
}
