'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { defaultSettings, Dish, filterDishes, stock } from '@/lib/content';
type Settings = Omit<typeof defaultSettings, 'hours'> & { hours: unknown };
export function Order({ url }: { url: string }) {
  if (!url) return null;
  return (
    <a className="button yellow" href={url} target="_blank" rel="noopener noreferrer">
      Order on Swiggy <span aria-hidden>↗</span>
    </a>
  );
}
export function Header({ settings }: { settings: Settings }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  return (
    <>
      <header className={scrolled ? 'header scrolled' : 'header'}>
        <Link className="wordmark" href="/">
          <Image
            className="header-logo"
            src="/madurai-express-logo.png"
            width={64}
            height={64}
            alt=""
            loading="eager"
          />
          <span className="wordmark-copy">
            MADURAI{' '}
            <span className="brand-name">
              EXPRESS<span className="brand-dot">.</span>
            </span>
            <small>AVANIYAPURAM • MADURAI</small>
          </span>
        </Link>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={open ? 'nav expanded' : 'nav'}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          {['Home', 'Menu', 'About', 'Gallery', 'Contact'].map((x) => (
            <Link
              key={x}
              href={x === 'Home' ? '/' : '/' + x.toLowerCase()}
              aria-current={
                path === (x === 'Home' ? '/' : '/' + x.toLowerCase()) ? 'page' : undefined
              }
            >
              {x}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="text-link" href="/menu">
            View Menu
          </Link>
          <Order url={settings.orderUrl} />
        </div>
        <button
          ref={toggle}
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? '✕' : '☰'}
        </button>
      </header>
      <nav className="bottom-nav" aria-label="Quick actions">
        <Link href="/menu">
          ☷<span>Menu</span>
        </Link>
        <a href={'tel:' + settings.phone}>
          ↗<span>Call</span>
        </a>
        <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer">
          ⌖<span>Directions</span>
        </a>
        {settings.orderUrl ? (
          <a href={settings.orderUrl} target="_blank" rel="noopener noreferrer">
            ↗<span>Order</span>
          </a>
        ) : (
          <a href={'tel:' + settings.phone}>
            ↗<span>Enquire</span>
          </a>
        )}
      </nav>
    </>
  );
}
export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <Link href="/" className="footer-brand">
            MADURAI EXPRESS<span>.</span>
          </Link>
          <p>
            South Indian dining.
            <br />
            Rooted in Avaniyapuram, Madurai.
          </p>
        </div>
        <div>
          <h3>Come hungry.</h3>
          <a href={'tel:' + settings.phone}>{settings.phone}</a>
          <p>{settings.addressConfirmed ? settings.address : 'Avaniyapuram, Madurai'}</p>
        </div>
        <div>
          <h3>Find your next favourite</h3>
          <Link href="/menu">Explore the menu ↗</Link>
          <p>
            <Link href="/contact">Contact & directions ↗</Link>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MADURAI EXPRESS</span>
        <span>
          {settings.orderUrl
            ? 'Checkout and delivery handled on Swiggy.'
            : 'Call for menu and availability enquiries.'}
        </span>
        <Link href="/admin">Admin</Link>
      </div>
    </footer>
  );
}
export function FoodPhoto({
  src = stock.hero,
  alt,
  priority = false,
  className = '',
  steam = false,
}: {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
  steam?: boolean;
}) {
  const photoRef = useRef<HTMLDivElement>(null);
  const [steaming, setSteaming] = useState(false);
  const canSteam = steam && src !== '/placeholder.svg';
  useEffect(() => {
    if (!canSteam || !photoRef.current || !('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => setSteaming(visible && !document.hidden && !motion.matches);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.15 },
    );
    observer.observe(photoRef.current);
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      motion.removeEventListener('change', update);
    };
  }, [canSteam, src]);
  return (
    <div
      ref={photoRef}
      className={'food-photo ' + className}
      data-steaming={steaming ? 'true' : undefined}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={priority}
        style={{ objectFit: 'cover' }}
      />
      {canSteam && (
        <svg className="photo-steam" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <g className="steam-wisp">
            <path d="M28 87 C14 70 41 61 29 44 C19 30 34 19 30 8" />
          </g>
          <g className="steam-wisp">
            <path d="M51 94 C37 76 64 63 51 46 C39 30 58 17 52 5" />
          </g>
          <g className="steam-wisp">
            <path d="M74 87 C60 69 86 57 74 42 C64 29 79 16 73 7" />
          </g>
        </svg>
      )}
    </div>
  );
}
export function DishCard({ dish }: { dish: Dish }) {
  return (
    <article className="dish-card reveal">
      <FoodPhoto
        steam
        src={
          dish.imageId
            ? '/api/images/' + dish.imageId
            : dish.demo
              ? dish.category.name === 'Dosai'
                ? stock.dosa
                : dish.category.name === 'South Indian'
                  ? stock.meal
                  : stock.hero
              : '/placeholder.svg'
        }
        alt={dish.demo ? 'Stock food photograph — not the restaurant’s dish' : dish.name}
      />
      <div className="dish-content">
        <div className="card-top">
          <span
            className={'diet ' + (dish.kind === 'VEG' ? 'veg' : 'nonveg')}
            aria-label={dish.kind === 'VEG' ? 'Vegetarian' : 'Non vegetarian'}
          >
            ●
          </span>
          <span className="muted">
            {dish.kind === 'VEG' ? 'Veg' : 'Non-veg'} · {dish.category.name}
          </span>
        </div>
        <h3>{dish.name}</h3>
        <p>{dish.description}</p>
        <div className="card-bottom">
          <strong>
            {dish.price === null
              ? 'Enquire for price'
              : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
                  dish.price / 100,
                )}
          </strong>
          <span className="status">
            {dish.demo ? 'Unconfirmed demo' : dish.available ? 'Available' : 'Unavailable'}
          </span>
        </div>
        {dish.demo && <small>Demonstration · not a confirmed menu item</small>}
      </div>
    </article>
  );
}
export function MenuBrowser({
  items,
  categories,
}: {
  items: Dish[];
  categories: { id: string; name: string }[];
}) {
  const params = useSearchParams();
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState(params.get('category') ?? ''),
    [kind, setKind] = useState('');
  const list = filterDishes(items, query, category, kind);
  return (
    <>
      <div className="menu-controls">
        <label className="search">
          Search dishes
          <input
            type="search"
            placeholder="What are you craving?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Food preference
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All dishes</option>
            <option value="VEG">Vegetarian</option>
            <option value="NON_VEG">Non vegetarian</option>
          </select>
        </label>
      </div>
      <div className="chips" aria-label="Menu categories">
        <button className={!category ? 'active' : ''} onClick={() => setCategory('')}>
          All dishes
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={category === c.id || category === c.name ? 'active' : ''}
            onClick={() => setCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <p className="muted" aria-live="polite">
        {list.length} dishes {category ? 'in this category' : 'to explore'}
      </p>
      <div className="dish-grid">
        {list.map((d) => (
          <DishCard key={d.id} dish={d} />
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <h2>No dishes found</h2>
          <p>Try another search or check back as the confirmed menu is added.</p>
          <button
            className="button red"
            onClick={() => {
              setQuery('');
              setCategory('');
              setKind('');
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </>
  );
}
export type GalleryImage = {
  id: string;
  alt: string;
  caption: string;
  group: string;
  src?: string;
};
export function Gallery({ images }: { images: GalleryImage[] }) {
  const [group, setGroup] = useState('All'),
    [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const list = images.filter((i) => group === 'All' || i.group === group);
  useEffect(() => {
    if (selected !== null) dialog.current?.showModal();
    else if (dialog.current?.open) {
      dialog.current.close();
      opener.current?.focus();
    }
  }, [selected]);
  return (
    <>
      <div className="chips">
        {['All', 'Food', 'Restaurant'].map((g) => (
          <button key={g} className={group === g ? 'active' : ''} onClick={() => setGroup(g)}>
            {g}
          </button>
        ))}
      </div>
      <div className="gallery-grid">
        {list.map((im, i) => (
          <button
            className="gallery-tile"
            key={im.id}
            onClick={(e) => {
              opener.current = e.currentTarget;
              setSelected(i);
            }}
          >
            <FoodPhoto
              src={im.src ?? '/api/images/' + im.id}
              alt={im.alt}
              steam={im.group === 'Food'}
            />
            <span>
              {im.caption || im.alt} <b aria-hidden>↗</b>
            </span>
          </button>
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <h2>Photos coming soon</h2>
          <p>
            Owner-approved{' '}
            {group.toLowerCase() === 'all' ? 'restaurant and food' : group.toLowerCase()}{' '}
            photographs will appear here.
          </p>
        </div>
      )}
      <dialog
        ref={dialog}
        className="lightbox"
        onCancel={(e) => {
          e.preventDefault();
          setSelected(null);
        }}
        onKeyDown={(e) => {
          if (selected !== null && e.key === 'ArrowRight')
            setSelected((selected + 1) % list.length);
          if (selected !== null && e.key === 'ArrowLeft')
            setSelected((selected - 1 + list.length) % list.length);
        }}
      >
        {selected !== null && list[selected] && (
          <>
            <button
              autoFocus
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Close image"
            >
              ✕
            </button>
            <FoodPhoto
              src={list[selected].src ?? '/api/images/' + list[selected].id}
              alt={list[selected].alt}
            />
            <p>{list[selected].caption}</p>
            <div className="lightbox-controls">
              <button onClick={() => setSelected((selected! - 1 + list.length) % list.length)}>
                ← Previous
              </button>
              <button onClick={() => setSelected((selected! + 1) % list.length)}>Next →</button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
