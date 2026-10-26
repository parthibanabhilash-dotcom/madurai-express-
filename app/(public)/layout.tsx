import { publicData } from '@/lib/data';
import { Header, Footer } from '@/components/site';
import { Reveals } from '@/components/reveals';
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { settings, demo, unavailable } = await publicData();
  return (
    <>
      <Header settings={settings} />
      <Reveals />
      {unavailable && !demo && (
        <div className="demo-banner" role="status">
          Live menu updates are temporarily unavailable. Please call the restaurant to confirm
          dishes, prices and opening hours.
        </div>
      )}
      {demo && (
        <div className="demo-banner">
          LOCAL DEMONSTRATION · Stock photography and provisional dishes. Menu, prices and
          availability require owner confirmation.
        </div>
      )}
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
