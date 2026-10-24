import { Gallery } from '@/components/site';
import { publicData } from '@/lib/data';
import { stock } from '@/lib/content';
export const metadata = {
  title: 'Gallery',
  description: 'Food and restaurant photographs from MADURAI EXPRESS, Avaniyapuram.',
  alternates: { canonical: '/gallery' },
};
export default async function Page() {
  const d = await publicData();
  const images = d.images.length
    ? d.images
    : d.demo
      ? Object.values(stock).map((src, i) => ({
          id: String(i),
          src,
          alt: 'Licensed demonstration stock food photograph',
          caption: 'Stock demonstration · not photographed at MADURAI EXPRESS',
          group: 'Food',
        }))
      : [];
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">TAKE A CLOSER LOOK</p>
        <h1>A feast for the eyes.</h1>
        <p>A little food inspiration. A glimpse of our place.</p>
      </section>
      <section className="section">
        <Gallery images={images} />
        {d.demo && (
          <p className="muted">
            Demo photography from Unsplash, used under the Unsplash License.{' '}
            <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">
              License ↗
            </a>
          </p>
        )}
      </section>
    </>
  );
}
