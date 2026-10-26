import Link from 'next/link';
import { BrandArtwork, BrandBanner } from '@/components/brand-art';
export const metadata = {
  title: 'About',
  description: 'Meet MADURAI EXPRESS, a restaurant in Avaniyapuram, Madurai.',
  alternates: { canonical: '/about' },
};
export default function About() {
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">MADURAI, THROUGH AND THROUGH</p>
        <h1>
          Local place.
          <br />
          Full-on flavour.
        </h1>
        <p>Welcome to MADURAI EXPRESS in Avaniyapuram, Madurai.</p>
      </section>
      <BrandBanner />
      <section className="section about-grid">
        <BrandArtwork />
        <div>
          <p className="eyebrow">FOOD THAT BRINGS US TOGETHER</p>
          <h2>
            A place for your
            <br />
            next craving.
          </h2>
          <p>
            MADURAI EXPRESS is a restaurant in Avaniyapuram, Madurai, Tamil Nadu. Find us in the
            Santhosh Nagar area on Airport Mattuthavani Ring Road.
          </p>
          <p>
            Browse our menu preview or get in touch to ask about dishes, prices, opening hours and
            availability. Confirmed menu details and owner-approved photographs will be added as
            they become available.
          </p>
          <div className="actions">
            <Link className="button yellow" href="/menu">
              Explore Menu ↗
            </Link>
            <Link className="button red" href="/contact">
              Find us ↗
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
