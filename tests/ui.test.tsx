// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { Header, MenuBrowser, Gallery, FoodPhoto, DishCard } from '../components/site';
import { BrandArtwork, BrandBanner } from '../components/brand-art';
import { Reveals } from '../components/reveals';
import { defaultSettings, demoDishes, categories } from '../lib/content';
it('labels an explicitly selected illustrative photo on a published dish', () => {
  render(<DishCard dish={{ ...demoDishes[0], demo: false, imageId: 'illustrative-biryani' }} />);
  expect(screen.getByText('Illustrative photo · not the actual dish')).toBeTruthy();
  expect(
    screen
      .getByAltText('Illustrative stock food photograph, not the actual dish')
      .getAttribute('src'),
  ).toBe('/demo-biryani.jpg');
  expect(screen.getByText('Enquire for price')).toBeTruthy();
  expect(screen.getByText('Unavailable')).toBeTruthy();
});
vi.mock('next/navigation', () => ({
  usePathname: () => '/menu',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock('next/image', () => ({
  default: ({
    fill,
    priority,
    preload,
    sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    preload?: boolean;
  }) => <img {...props} />,
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('public interactions', () => {
  it('opens and closes mobile navigation with Escape and restores focus', () => {
    render(<Header settings={defaultSettings} />);
    const toggle = screen.getByRole('button', { name: 'Toggle navigation' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(screen.getByRole('navigation', { name: 'Main navigation' }), {
      key: 'Escape',
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });
  it('provides working call, directions and safe external ordering links', () => {
    const configured = {
      ...defaultSettings,
      orderUrl: 'https://www.swiggy.com/city/madurai/verified-fixture',
    };
    render(<Header settings={configured} />);
    const quick = screen.getByRole('navigation', { name: 'Quick actions' });
    const links = quick.querySelectorAll('a');
    expect(links[0].getAttribute('href')).toBe('/menu');
    expect(links[1].getAttribute('href')).toBe('tel:+919342328311');
    expect(links[2].getAttribute('href')).toContain('google.com/maps/search');
    expect(links[3].getAttribute('href')).toBe(configured.orderUrl);
    expect(links[3].getAttribute('rel')).toContain('noopener');
    expect(screen.getByRole('link', { name: 'Menu', current: 'page' })).toBeTruthy();
  });
  it('uses a call enquiry when the new restaurant has no verified ordering URL', () => {
    render(<Header settings={defaultSettings} />);
    expect(screen.queryByRole('link', { name: /Order on Swiggy/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Enquire/ }).getAttribute('href')).toBe(
      'tel:' + defaultSettings.phone,
    );
  });
  it('combines search and filters and resets an empty result', () => {
    render(
      <MenuBrowser
        items={demoDishes}
        categories={categories.map((name) => ({ id: name, name }))}
      />,
    );
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'mutton' } });
    expect(screen.getByText('6 dishes to explore')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'VEG' } });
    expect(screen.getByText('No dishes found')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByText('60 dishes to explore')).toBeTruthy();
  });
  it('enlarges gallery images, navigates with keyboard and closes with focus restored', async () => {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
    render(
      <Gallery
        images={[
          { id: 'a', src: '/a.jpg', alt: 'Food one', caption: 'First food', group: 'Food' },
          { id: 'b', src: '/b.jpg', alt: 'Food two', caption: 'Second food', group: 'Food' },
        ]}
      />,
    );
    const opener = screen.getByRole('button', { name: /First food/ });
    fireEvent.click(opener);
    const dialog = document.querySelector('dialog')!;
    await waitFor(() => expect(dialog.open).toBe(true));
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(dialog.textContent).toContain('Second food');
    fireEvent.click(screen.getByRole('button', { name: 'Close image' }));
    await waitFor(() => expect(dialog.open).toBe(false));
    expect(document.activeElement).toBe(opener);
  });
});

describe('motion and supplied artwork', () => {
  function viewportMock() {
    let enter: (entries: { target?: Element; isIntersecting: boolean }[]) => void = () => {};
    const observe = vi.fn(),
      unobserve = vi.fn(),
      disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof enter) {
          enter = callback;
        }
        observe = observe;
        unobserve = unobserve;
        disconnect = disconnect;
      },
    );
    const motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.spyOn(window, 'matchMedia').mockReturnValue(motion as unknown as MediaQueryList);
    return {
      enter: (entries: Parameters<typeof enter>[0]) => act(() => enter(entries)),
      observe,
      unobserve,
      disconnect,
      motion,
    };
  }
  it('runs decorative steam only on visible food photos and stops for reduced motion', () => {
    const viewport = viewportMock();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const { container } = render(<FoodPhoto src="/food.jpg" alt="Owner-approved food" steam />);
    const photo = container.querySelector('.food-photo')!;
    expect(photo.getAttribute('data-steaming')).toBeNull();
    viewport.enter([{ isIntersecting: true }]);
    expect(photo.getAttribute('data-steaming')).toBe('true');
    viewport.enter([{ isIntersecting: false }]);
    expect(photo.getAttribute('data-steaming')).toBeNull();
    viewport.enter([{ isIntersecting: true }]);
    viewport.motion.matches = true;
    act(() => viewport.motion.addEventListener.mock.calls[0][1]());
    expect(photo.getAttribute('data-steaming')).toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
  it('uses both full artwork assets without steam or cropping and excludes placeholders from steam', () => {
    const { container } = render(
      <>
        <BrandArtwork />
        <BrandBanner />
        <FoodPhoto src="/placeholder.svg" alt="Photo pending" steam />
      </>,
    );
    expect(screen.getByAltText(/temple and road logo/).getAttribute('src')).toBe(
      '/madurai-express-logo.png',
    );
    expect(screen.getByAltText(/yellow banner/).getAttribute('src')).toBe(
      '/madurai-express-banner.png',
    );
    expect(screen.getByRole('link', { name: /View full banner/ }).getAttribute('href')).toBe(
      '/madurai-express-banner.png',
    );
    expect(container.querySelector('.photo-steam')).toBeNull();
  });
  it('reveals sections on entry, observes newly filtered cards, and cancels for reduced motion', async () => {
    const viewport = viewportMock();
    render(
      <main id="main">
        <div className="category">Section content</div>
        <Reveals />
      </main>,
    );
    const target = screen.getByText('Section content');
    const cancel = vi.fn();
    const animate = vi.fn(
      () => ({ finished: new Promise(() => {}), cancel }) as unknown as Animation,
    );
    target.animate = animate;
    viewport.enter([{ target, isIntersecting: true }]);
    expect(animate).toHaveBeenCalledOnce();
    expect(viewport.unobserve).toHaveBeenCalledWith(target);
    const fresh = document.createElement('article');
    fresh.className = 'dish-card';
    document.getElementById('main')!.append(fresh);
    await waitFor(() => expect(viewport.observe).toHaveBeenCalledWith(fresh));
    viewport.motion.matches = true;
    act(() => viewport.motion.addEventListener.mock.calls[0][1]());
    expect(cancel).toHaveBeenCalledOnce();
  });
});
