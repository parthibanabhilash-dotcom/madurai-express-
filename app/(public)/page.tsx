import Link from 'next/link';
import { Hours } from '@/components/hours';
import { publicData } from '@/lib/data';
import { categories, stock } from '@/lib/content';
import { DishCard, FoodPhoto, Order } from '@/components/site';
export const metadata = { alternates: { canonical: '/' } };
export default async function Home() {
  const {
    settings,
    items,
    images,
    offers,
    demo,
    categories: configuredCategories,
  } = await publicData();
  const featured = items.filter((x) => x.featured);
  const heroImage = images.find((image) => image.group === 'Food');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'MADURAI EXPRESS',
    telephone: settings.phone,
    servesCuisine: ['South Indian'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Avaniyapuram, Madurai',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
      ...(settings.addressConfirmed ? { streetAddress: settings.address } : {}),
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> AVANIYAPURAM, MADURAI
          </div>
          <h1>
            Madurai flavours.
            <br />
            <em>Full-on taste.</em>
          </h1>
          <p>
            Discover South Indian dining at MADURAI EXPRESS in Avaniyapuram, Madurai. Explore our
            menu preview or call us with your enquiries.
          </p>
          <div className="actions">
            <Link className="button yellow" href="/menu">
              View Menu <span>↗</span>
            </Link>
            <a className="button outline" href={'tel:' + settings.phone}>
              Call Restaurant ↗
            </a>
          </div>
          <a
            className="directions-link"
            href={settings.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            ⌖ Get Directions <span>— Maps {settings.mapConfirmed ? 'pin' : 'search'}</span>
          </a>
          <div className="hero-footnote">
            <span>வணக்கம்!</span>
            <span>
              A taste of Madurai.
              <br />A reason to come hungry.
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <FoodPhoto
            priority
            src={heroImage ? '/api/images/' + heroImage.id : demo ? stock.hero : '/placeholder.svg'}
            alt={
              heroImage
                ? heroImage.alt
                : demo
                  ? 'Demonstration stock photograph of biryani'
                  : 'Restaurant photography awaiting owner approval'
            }
          />
          <div className="image-label">
            {demo && !heroImage ? 'BIRYANI · STOCK PHOTO' : 'SOUTH INDIAN DINING · MADURAI'}
          </div>
          <div className="round-note">
            BIG
            <br />
            <b>MADURAI</b>
            <br />
            FLAVOURS ↗
          </div>
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        SOUTH INDIAN <span>✳</span> MADURAI EXPRESS <span>✳</span> AVANIYAPURAM <span>✳</span>{' '}
        MADURAI <span>✳</span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SOMETHING FOR EVERY CRAVING</p>
            <h2>Good food. Your way.</h2>
          </div>
          <Link className="text-link" href="/menu">
            Explore our menu ↗
          </Link>
        </div>
        <div className="category-grid">
          {(configuredCategories.length
            ? configuredCategories.map((c) => c.name)
            : demo
              ? categories
              : []
          ).map((c, i) => (
            <Link href={'/menu?category=' + encodeURIComponent(c)} className="category" key={c}>
              <span className="category-number">0{i + 1}</span>
              <h3>{c}</h3>
              <span className="category-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>
      {featured.length > 0 && (
        <section className="section featured">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{demo ? 'A PREVIEW OF THE POSSIBILITIES' : 'FROM OUR MENU'}</p>
              <h2>{demo ? 'Meet the menu preview.' : 'In the spotlight.'}</h2>
            </div>
            <span className="muted">
              {demo ? 'Provisional dishes · confirmation pending' : 'Selected by our restaurant'}
            </span>
          </div>
          <div className="dish-grid">
            {featured.map((d) => (
              <DishCard key={d.id} dish={d} />
            ))}
          </div>
        </section>
      )}
      <section className="story section">
        <div className="story-art">
          <span>வணக்கம்</span>
          <h2>
            Madurai.
            <br />
            On a plate.
          </h2>
          <div className="story-stamp">
            MADURAI EXPRESS
            <br />
            AVANIYAPURAM
          </div>
        </div>
        <div className="story-copy">
          <p className="eyebrow">LOCAL ROOTS. FULL FLAVOUR.</p>
          <h2>
            Your next food stop
            <br />
            in Avaniyapuram.
          </h2>
          <p>
            MADURAI EXPRESS is a restaurant in Avaniyapuram, Madurai. Explore the menu preview, find
            directions, or call to enquire about dishes, prices and availability.
          </p>
          <Link className="button red" href="/about">
            Get to know us ↗
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A LITTLE LOOK AROUND</p>
            <h2>Feast your eyes.</h2>
          </div>
          <Link href="/gallery" className="text-link">
            View gallery ↗
          </Link>
        </div>
        {images.length > 0 ? (
          <div className="gallery-grid">
            {images.slice(0, 3).map((im) => (
              <Link href="/gallery" key={im.id}>
                <FoodPhoto src={'/api/images/' + im.id} alt={im.alt} />
              </Link>
            ))}
          </div>
        ) : demo ? (
          <>
            <div className="gallery-grid">
              {[stock.hero, stock.dosa, stock.meal].map((src, i) => (
                <Link href="/gallery" key={src}>
                  <FoodPhoto src={src} alt={'Demonstration stock food photograph ' + (i + 1)} />
                </Link>
              ))}
            </div>
            <p className="muted">
              Demonstration stock photography. Restaurant photos coming after owner approval.
            </p>
          </>
        ) : (
          <p>Owner-approved food and restaurant photographs coming soon.</p>
        )}
      </section>
      {offers.length > 0 && (
        <section className="section offers">
          <p className="eyebrow">A LITTLE EXTRA</p>
          <h2>On the menu right now.</h2>
          {offers.map((o) => (
            <article key={o.id}>
              <h3>{o.title}</h3>
              <p>{o.description}</p>
              <small>
                Until {o.endsAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </small>
            </article>
          ))}
        </section>
      )}
      <section className="visit">
        <div>
          <p className="eyebrow">COME FIND US</p>
          <h2>
            Hungry?
            <br />
            You know where to go.
          </h2>
          <p>{settings.addressConfirmed ? settings.address : 'Avaniyapuram, Madurai'}</p>
          <Hours value={settings.hours} />
          <div className="actions">
            <a
              className="button yellow"
              href={settings.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Directions ↗
            </a>
            <a className="button white" href={'tel:' + settings.phone}>
              Call Restaurant ↗
            </a>
          </div>
          <p className="small">
            Directions open a Google Maps {settings.mapConfirmed ? 'pin' : 'search'}.
          </p>
        </div>
        <div className="visit-order">
          <span className="big-arrow">↗</span>
          <h3>
            {settings.orderUrl ? 'Staying in?' : 'Planning a visit?'}
            <br />
            {settings.orderUrl ? 'We’re on Swiggy.' : 'Give us a call.'}
          </h3>
          {settings.orderUrl ? (
            <>
              <Order url={settings.orderUrl} />
              <p>Checkout and delivery handled on Swiggy.</p>
            </>
          ) : (
            <>
              <a className="button yellow" href={'tel:' + settings.phone}>
                Call Restaurant
              </a>
              <p>Ask about the menu, prices and availability.</p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
