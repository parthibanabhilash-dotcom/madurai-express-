import Image from 'next/image';

export function BrandArtwork({
  className = '',
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={'brand-artwork ' + className} data-scroll-reveal>
      <Image
        src="/madurai-express-logo.png"
        width={1254}
        height={1254}
        preload={priority}
        sizes="(max-width: 768px) 90vw, 45vw"
        alt="Madurai Express temple and road logo with the tagline Delivering your world."
      />
    </div>
  );
}

export function BrandBanner() {
  return (
    <figure className="brand-banner" data-scroll-reveal>
      <Image
        src="/madurai-express-banner.png"
        width={2070}
        height={760}
        sizes="90vw"
        alt="Madurai Express yellow banner with a temple skyline, English and Tamil lettering, and parcel, documents, logistics and express icons."
      />
      <figcaption>
        <a href="/madurai-express-banner.png" target="_blank" rel="noopener noreferrer">
          View full banner <span aria-hidden="true">↗</span>
        </a>
      </figcaption>
    </figure>
  );
}
