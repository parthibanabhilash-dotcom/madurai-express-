// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { Header, MenuBrowser, Gallery } from '../components/site';
import { defaultSettings, demoDishes, categories } from '../lib/content';
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
    sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} />
  ),
}));
afterEach(cleanup);
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
    expect(screen.getByText('3 dishes to explore')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'VEG' } });
    expect(screen.getByText('No dishes found')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByText('8 dishes to explore')).toBeTruthy();
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
