import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="section empty">
      <p className="eyebrow">404</p>
      <h1>A little off the menu.</h1>
      <p>This page could not be found.</p>
      <Link className="button red" href="/">
        Back to home ↗
      </Link>
    </main>
  );
}
