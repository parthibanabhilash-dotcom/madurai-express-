import { Suspense } from 'react';
import { publicData } from '@/lib/data';
import { categories } from '@/lib/content';
import { MenuBrowser, Order } from '@/components/site';
export const metadata = {
  title: 'Menu',
  description: 'Explore the confirmed MADURAI EXPRESS menu by category and food preference.',
  alternates: { canonical: '/menu' },
};
export default async function Menu() {
  const d = await publicData();
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">FIND YOUR NEXT FAVOURITE</p>
        <h1>The menu.</h1>
        <p>South Indian, biryani and fast food. Explore what’s cooking.</p>
        <Order url={d.settings.orderUrl} />
        {d.settings.orderUrl && <small>Checkout and delivery handled on Swiggy.</small>}
      </section>
      <section className="section menu-section">
        <Suspense fallback={<p>Loading menu filters…</p>}>
          <MenuBrowser
            items={d.items}
            categories={
              d.categories.length ? d.categories : categories.map((name) => ({ id: name, name }))
            }
          />
        </Suspense>
      </section>
    </>
  );
}
