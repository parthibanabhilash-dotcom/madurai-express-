'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="section empty">
      <h1>We’ll be right back.</h1>
      <p>
        Restaurant information is temporarily unavailable. Please call +91 93423 28311 for
        enquiries.
      </p>
      <div className="actions">
        <button className="button red" onClick={reset}>
          Try again
        </button>
        <a className="button yellow" href="tel:+919342328311">
          Call Restaurant
        </a>
      </div>
    </main>
  );
}
