import { publicData } from '@/lib/data';
import { Order } from '@/components/site';
export const metadata = {
  title: 'Contact & Directions',
  description: 'Call MADURAI EXPRESS or find directions to Avaniyapuram, Madurai.',
  alternates: { canonical: '/contact' },
};
export default async function Contact() {
  const { settings: s } = await publicData();
  const hours = s.hours as { day: string; closed: boolean; open: string; close: string }[] | null;
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">COME SAY VANAKKAM</p>
        <h1>
          Find your way
          <br />
          to MADURAI EXPRESS.
        </h1>
        <p>Avaniyapuram, Madurai, Tamil Nadu.</p>
      </section>
      <section className="section contact-grid">
        <article className="contact-card">
          <span className="icon-circle">⌖</span>
          <h2>Visit us</h2>
          <p>{s.addressConfirmed ? s.address : 'Avaniyapuram, Madurai'}</p>
          <a href={s.mapUrl} className="button red" target="_blank" rel="noopener noreferrer">
            {s.mapConfirmed ? 'Get Directions' : 'Open Maps search'} ↗
          </a>
          <p className="muted">
            {s.mapConfirmed
              ? 'Directions to our confirmed location.'
              : 'Exact address and map pin are awaiting owner confirmation.'}
          </p>
        </article>
        <article className="contact-card">
          <span className="icon-circle">↗</span>
          <h2>Give us a call</h2>
          <p>Enquire about our menu, prices and availability.</p>
          <a className="button yellow" href={'tel:' + s.phone}>
            {s.phone}
          </a>
          {s.whatsappEnabled && s.whatsappNumber && (
            <p>
              <a
                className="button red"
                href={'https://wa.me/' + s.whatsappNumber.replace(/\D/g, '')}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp enquiries ↗
              </a>
            </p>
          )}
        </article>
        <article className="contact-card">
          <h2>Opening hours</h2>
          {hours?.length ? (
            hours.map((h) => (
              <p className="hours-row" key={h.day}>
                <strong>{h.day}</strong>
                <span>{h.closed ? 'Closed' : h.open + ' – ' + h.close}</span>
              </p>
            ))
          ) : (
            <p>Please call the restaurant to confirm opening hours.</p>
          )}
          <small>All times are local to Madurai (IST).</small>
        </article>
        <article className="contact-card red-card">
          <h2>{s.orderUrl ? 'Food at your doorstep.' : 'Let us talk food.'}</h2>
          <p>
            {s.orderUrl
              ? 'Explore delivery options on Swiggy.'
              : 'Call for menu, opening hours and availability enquiries.'}
          </p>
          {s.orderUrl ? (
            <>
              <Order url={s.orderUrl} />
              <p className="small">Checkout and delivery are handled on Swiggy.</p>
            </>
          ) : (
            <a className="button yellow" href={'tel:' + s.phone}>
              Call Restaurant
            </a>
          )}
        </article>
      </section>
    </>
  );
}
