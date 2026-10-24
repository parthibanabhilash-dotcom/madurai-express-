import Link from 'next/link';
import { HoursEditor } from '@/components/hours-editor';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { defaultSettings } from '@/lib/content';
import { AdminForm } from '@/components/admin-form';
const check = (name: string, label: string, value = false) => (
  <label className="check">
    <input type="checkbox" name={name} defaultChecked={value} />
    {label}
  </label>
);
const input = (
  name: string,
  label: string,
  value: string | number = '',
  type = 'text',
  required = true,
) => (
  <label>
    {label}
    <input name={name} type={type} defaultValue={value} required={required} />
  </label>
);
const date = (d: Date) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 16);
export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const s = await requireAdmin();
  const tab = (await searchParams).tab ?? 'dashboard';
  const [categories, items, images, offers, settings] = await Promise.all([
    db.category.findMany({ orderBy: { name: 'asc' } }),
    db.menuItem.findMany({ include: { category: true }, orderBy: { name: 'asc' } }),
    db.image.findMany({ orderBy: { createdAt: 'desc' } }),
    db.offer.findMany({ orderBy: { startsAt: 'desc' } }),
    db.settings.findUnique({ where: { id: 'business' } }),
  ]);
  const business = settings ?? defaultSettings;
  return (
    <>
      <header className="admin-header">
        <Link className="footer-brand" href="/">
          MADURAI EXPRESS.
        </Link>
        <span>Restaurant administration</span>
        <AdminForm csrf={s.csrf} action="logout" />
      </header>
      <div className="admin-layout">
        <aside>
          <nav aria-label="Admin sections">
            {['dashboard', 'menu', 'categories', 'images', 'offers', 'settings'].map((t) => (
              <Link key={t} href={'/admin?tab=' + t} aria-current={t === tab ? 'page' : undefined}>
                {t}
              </Link>
            ))}
          </nav>
          <Link href="/">View website ↗</Link>
        </aside>
        <section className="admin-content">
          <p className="eyebrow">YOUR RESTAURANT, YOUR WAY</p>
          <h1>{tab}</h1>
          {tab === 'dashboard' && (
            <>
              <div className="stats">
                {[
                  ['Menu items', items.length],
                  ['Published', items.filter((i) => i.published && !i.demo).length],
                  ['Gallery photos', images.filter((i) => i.gallery).length],
                  [
                    'Active offers',
                    offers.filter(
                      (o) => o.published && o.startsAt <= new Date() && o.endsAt > new Date(),
                    ).length,
                  ],
                ].map(([label, n]) => (
                  <article key={label}>
                    <strong>{n}</strong>
                    <span>{label}</span>
                  </article>
                ))}
              </div>
              <div className="admin-box">
                <h2>Owner confirmation checklist</h2>
                <p>
                  Exact address, map pin, weekly hours, final menu, prices, restaurant photos and
                  WhatsApp availability remain subject to owner confirmation.
                </p>
                <p>
                  Provisional dishes are drafts. Publishing a real item requires clearing its
                  demonstration flag and confirming its details.
                </p>
                <Link className="button red" href="/admin?tab=menu">
                  Manage menu ↗
                </Link>
              </div>
            </>
          )}
          {tab === 'categories' && (
            <>
              <div className="admin-box">
                <h2>Add category</h2>
                <AdminForm csrf={s.csrf} action="category">
                  {input('name', 'Category name')}
                </AdminForm>
              </div>
              {categories.map((c) => (
                <div className="admin-box" key={c.id}>
                  <AdminForm csrf={s.csrf} action="category" id={c.id}>
                    {input('name', 'Category name', c.name)}
                  </AdminForm>
                  <AdminForm csrf={s.csrf} action="delete-category" id={c.id} danger />
                </div>
              ))}
            </>
          )}
          {tab === 'menu' && (
            <>
              {[null, ...items].map((item) => (
                <details className="admin-box" key={item?.id ?? 'new'} open={!item}>
                  <summary>
                    {item
                      ? `${item.name} · ${item.published ? 'Published' : 'Draft'}${item.demo ? ' · Demo' : ''}`
                      : 'Add a menu item'}
                  </summary>
                  <AdminForm csrf={s.csrf} action="item" id={item?.id}>
                    {input('name', 'Dish name', item?.name)}
                    <label>
                      Description
                      <textarea
                        name="description"
                        maxLength={1000}
                        defaultValue={item?.description}
                      />
                    </label>
                    <label>
                      Category
                      <select name="categoryId" defaultValue={item?.categoryId} required>
                        {categories.map((c) => (
                          <option value={c.id} key={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Image
                      <select name="imageId" defaultValue={item?.imageId ?? ''}>
                        <option value="">No image</option>
                        {images.map((im) => (
                          <option key={im.id} value={im.id}>
                            {im.alt}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Confirmed price (INR, blank = enquire)
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={item?.price == null ? '' : item.price / 100}
                      />
                    </label>
                    <label>
                      Classification
                      <select name="kind" defaultValue={item?.kind ?? 'NON_VEG'}>
                        <option value="VEG">Vegetarian</option>
                        <option value="NON_VEG">Non vegetarian</option>
                      </select>
                    </label>
                    {check('available', 'Available (owner confirmed)', item?.available)}
                    {check('featured', 'Featured dish', item?.featured)}
                    {check('demo', 'Demonstration / provisional item', item?.demo ?? true)}
                    {check('published', 'Publish to public menu', item?.published)}
                  </AdminForm>
                  {item && <AdminForm csrf={s.csrf} action="delete-item" id={item.id} danger />}
                </details>
              ))}
            </>
          )}
          {tab === 'images' && (
            <>
              <div className="admin-box">
                <h2>Upload image</h2>
                <p>
                  JPEG, PNG or WebP. Maximum 5 MB; minimum 100 × 100 pixels. Upload only photographs
                  you own or have permission to use.
                </p>
                <AdminForm csrf={s.csrf} action="upload">
                  <label>
                    Image
                    <input
                      name="file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                    />
                  </label>
                  {input('alt', 'Descriptive alt text')}
                  {input('caption', 'Caption', '', 'text', false)}
                  <label>
                    Category
                    <select name="group">
                      <option>Food</option>
                      <option>Restaurant</option>
                    </select>
                  </label>
                  {check('gallery', 'Publish in gallery')}
                </AdminForm>
              </div>
              {images.map((im) => (
                <div className="admin-box" key={im.id}>
                  <img className="admin-thumbnail" src={'/api/images/' + im.id} alt={im.alt} />
                  <AdminForm csrf={s.csrf} action="image" id={im.id}>
                    {input('alt', 'Alt text', im.alt)}
                    {input('caption', 'Caption', im.caption, 'text', false)}
                    <label>
                      Category
                      <select name="group" defaultValue={im.group}>
                        <option>Food</option>
                        <option>Restaurant</option>
                      </select>
                    </label>
                    {check('gallery', 'Publish in gallery', im.gallery)}
                  </AdminForm>
                  <AdminForm csrf={s.csrf} action="delete-image" id={im.id} danger />
                </div>
              ))}
            </>
          )}
          {tab === 'offers' && (
            <>
              <p>
                Start and expiry times use Madurai local time (Asia/Kolkata). Expired offers are
                hidden automatically.
              </p>
              {[null, ...offers].map((o) => (
                <details key={o?.id ?? 'new'} className="admin-box" open={!o}>
                  <summary>{o?.title ?? 'Add offer'}</summary>
                  <AdminForm csrf={s.csrf} action="offer" id={o?.id}>
                    {input('title', 'Title', o?.title)}
                    <label>
                      Description
                      <textarea name="description" defaultValue={o?.description} />
                    </label>
                    {input('startsAt', 'Starts (IST)', o ? date(o.startsAt) : '', 'datetime-local')}
                    {input('endsAt', 'Expires (IST)', o ? date(o.endsAt) : '', 'datetime-local')}
                    {check('published', 'Enable offer', o?.published)}
                  </AdminForm>
                  {o && <AdminForm csrf={s.csrf} action="delete-offer" id={o.id} danger />}
                </details>
              ))}
            </>
          )}
          {tab === 'settings' && (
            <div className="admin-box">
              <AdminForm csrf={s.csrf} action="settings">
                {input('phone', 'Telephone (international format)', business.phone)}
                {input('address', 'Full address', business.address)}
                {check(
                  'addressConfirmed',
                  'Exact address confirmed by owner',
                  business.addressConfirmed,
                )}
                {input('mapUrl', 'Google Maps URL', business.mapUrl, 'url')}
                {check('mapConfirmed', 'Exact map pin confirmed', business.mapConfirmed)}
                {input(
                  'orderUrl',
                  'Verified Swiggy URL (blank = disabled)',
                  business.orderUrl,
                  'url',
                  false,
                )}
                <HoursEditor initial={business.hours} />
                <p className="muted">
                  All hours use Madurai local time. A closing time earlier than opening means the
                  following day.
                </p>
                {check(
                  'whatsappEnabled',
                  'Enable WhatsApp (number confirmed to accept enquiries)',
                  business.whatsappEnabled,
                )}
                {input(
                  'whatsappNumber',
                  'WhatsApp international number',
                  business.whatsappNumber,
                  'tel',
                  false,
                )}
              </AdminForm>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
