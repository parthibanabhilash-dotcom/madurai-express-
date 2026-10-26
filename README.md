# MADURAI EXPRESS

Local-only restaurant website and administration application. Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma and S3-compatible image storage. No deployment has been performed.

## Local setup

For Vercel environment variables, hosted database initialization and runtime-error troubleshooting, see [VERCEL_SETUP.md](VERCEL_SETUP.md). Public pages now remain available during database setup/outages with a clear live-menu notice; admin still requires hosted PostgreSQL.

Requirements: Node.js 22 or 24 and Docker Desktop with Compose. In Windows PowerShell use `npm.cmd` and `npx.cmd` if script execution policy blocks `npm`.

```sh
npm ci
cp .env.example .env
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run storage:setup
npm run admin:setup
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin. The setup command asks for an administrator email and a hidden password (at least 14 characters), then hashes it using bcrypt with cost 12. It refuses to overwrite existing administrators. No default admin credentials exist. Keep `.env` private. To reset access, create a replacement administrator through the setup command, then revoke the old administrator and all its sessions through a trusted database console. No public account registration or password-reset endpoint is exposed.

Container credentials in `.env.example` and `compose.yaml` are exclusively for local development. Do not reuse them elsewhere or expose these local services to a network. Database and image data live in named Docker volumes and survive container restarts. Do not remove those volumes unless deliberately resetting the installation.

### Without Docker (local development only)

The project also includes a bundled PostgreSQL runner and an S3 sandbox for this Windows environment. Start `npm run db:local` in one terminal and `npm run storage:local` in another. Set `S3_ACCESS_KEY=S3RVER` and `S3_SECRET_KEY=S3RVER` in your private `.env`, then follow the migration, seed and administrator setup commands above. Keep both service terminals open. PostgreSQL data persists in `.local/postgres`; sandbox images persist in `.local/images`. Both bind to loopback. `.local` is ignored by Git. Do not run the database container and bundled database simultaneously on the same port.

The S3 sandbox is a development/test tool, not production storage; the production application always uses the configured S3-compatible service. Its dependencies have development-only audit advisories documented in `VERIFICATION.md`. Use the Docker MinIO service or a managed S3 provider for production-like testing.

## Business administration

The dashboard reads actual database counts. Categories, menu items, prices, availability, featured selections, gallery images, offers and business settings can be managed under `/admin`. All writes require an authenticated server session, matching CSRF token and matching application origin. Sessions expire after eight hours. Login attempts are limited to five per email over fifteen minutes, including successful attempts. Cookies are HTTP-only, SameSite-protected and HTTPS-only in production. An edge/IP rate limit should additionally be configured at the eventual hosting ingress for public deployment.

Upload your own approved images in Images, then select them when editing dishes. JPEG, PNG and WebP only, 5 MB maximum, at least 100 × 100 pixels and at most 25 megapixels. Images are decoded and re-encoded into WebP; metadata is removed. Animated images and SVG are rejected. The bucket stays private; application routes authorize unpublished images. Deleting an image record does not purge its object from storage; retained unreferenced objects can be cleaned up using the storage provider after backup review. This avoids losing shared or accidentally detached assets.

The newest published Food gallery image supplies the homepage hero. Until one is uploaded, production shows the supplied brand artwork; local demo mode uses explicitly labelled stock photography.

Menu prices are entered in rupees, stored as integer paise and may be blank. Blank prices display “Enquire for price.” Draft and demo items do not appear in the live menu. Category deletion is blocked while dishes reference it. Image deletion is blocked while dishes reference it. Delete actions request confirmation in the admin interface.

Offer times entered in the admin are **Asia/Kolkata**, stored in UTC. An enabled offer is visible at its start time and disappears exactly at its expiry. Unpublished, future and expired offers are hidden.

Opening hours remain unconfigured until confirmed. In Settings, enable “Hours confirmed by owner,” then enter opening and closing times for each weekday or mark that day closed. A closing time earlier than opening represents an overnight schedule. Disable the confirmation checkbox to remove configured hours. The website never computes an “Open now” badge. WhatsApp remains off unless the owner explicitly confirms the number.

## Demonstration content

`db:seed` creates business defaults, six categories and **60 draft, unconfirmed, demo dishes: 10 per category**. Suggested names and classifications are examples pending owner confirmation. It never adds prices, availability, approved photography, hours or offers. Stable identifiers preserve the original eight draft records and avoid duplicates on repeat runs. Existing records, including owner edits, are not overwritten. The expanded catalog is visible only in the explicitly labelled local demo or as drafts in the database/admin; it is not a published restaurant menu.

`DEMO_PREVIEW=true` enables clearly labelled demonstration content only when `NODE_ENV` is not `production`. If no published menu exists, the local preview displays provisional dishes; it is not a verified restaurant menu. The demo flag cannot be published by server validation. Convert a draft to a real item only after owner confirmation, clear its demo flag, confirm its classification and availability, then publish it. Production contains no stock-photo fallback and no demo items, even if `DEMO_PREVIEW=true` was accidentally retained. Production database failures show a clear live-menu notice and known contact/location information; they never enable demonstration content.

Preview photographs are served from Unsplash under the [Unsplash License](https://unsplash.com/license). They depict stock food, not this restaurant or its actual dishes. Sources:

- https://images.unsplash.com/photo-1633945274309-2c16c9682a8c
- https://images.unsplash.com/photo-1668236543090-82eba5ee5976
- https://images.unsplash.com/photo-1546833999-b9f581a1996d

Replace them with approved owner photographs. No reference-site, listing or delivery-platform photographs are used.

## Image storage and production configuration

Local MinIO runs at http://localhost:9000, with its console at http://localhost:9001. `storage:setup` creates the configured private bucket. Configure `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY` and `S3_SECRET_KEY` for your durable S3-compatible provider. Use a dedicated least-privilege storage identity with object read/write permissions for this bucket. The setup command additionally needs bucket creation/check access; pre-create the bucket if using a restricted runtime identity.

Set `DATABASE_URL` to PostgreSQL, `APP_URL` to the exact HTTPS application origin, and `NEXT_PUBLIC_SITE_URL` to the final canonical domain. Run migrations before starting the application. Use `npm run build` followed by `npm start`. Production requires HTTPS because session cookies are secure. Keep database connections and storage credentials server-side. Back up both PostgreSQL and the image bucket. No internal cart, payments, reservations or delivery tracking are included.

## Checks

```sh
npm run typecheck
npm test
npm run test:integration
npm run test:smoke
npm run build
```

Integration tests require `TEST_DATABASE_URL` pointing to a separate migrated PostgreSQL database, never the restaurant database. They create and remove only records bearing their test identifiers. See `VERIFICATION.md` for checks actually performed in this environment and browser/infrastructure limitations.

The bundled database runner creates `madurai_test` for tests. Apply migrations to that database by temporarily pointing `DATABASE_URL` to it, then restore the restaurant database URL. Set `TEST_DATABASE_URL` to the test database connection; the runner refuses names that do not end in `_test`. Set `TEST_S3=true` to include the real upload/read/publication test against your configured local S3-compatible service. `test:smoke` requires a running application; use `EXPECT_PRODUCTION=true` against `npm start` to additionally check production demo exclusion.

## Owner handover

Confirm before publishing restaurant information:

- **Address:** public listings show `SM Complex, 220/2A, Airport Mattuthavani Ring Rd, Santhosh Nagar, Avaniyapuram, Madurai, Tamil Nadu 625012`. Stored in editable settings; public address remains Avaniyapuram, Madurai until owner confirmation.
- **Telephone:** +91 93423 28311 comes from the matching public listing; owner confirmation is still recommended.
- Exact Google Maps pin; the default link is explicitly a Maps search.
- Weekly opening hours.
- Final menu, dietary classification, availability and owner-selected featured dishes.
- Confirmed prices and any applicable offer wording/dates.
- Owner-approved restaurant and food photographs, captions and alt text.
- Whether the supplied number accepts WhatsApp enquiries.

The supplied Google share link resolves to Madurai Express. The prior restaurant ordering link has been removed. No Swiggy link has been verified for this branch, so ordering controls are hidden and the mobile fourth action is Enquire (call). Admins may configure a verified Swiggy link later. No founding story, awards, certifications, ratings, review counts or unsupported quality claims have been added.

## Current restaurant and colours

The restaurant identity is MADURAI EXPRESS, Avaniyapuram. The user-supplied listing is https://share.google/zN6aijCYYeQDGcG0D (Google entity /g/11y54p57zn). Supporting address/phone source: https://mindtrip.ai/restaurant/thiruparankundram-tamil-nadu/madurai-express/re-UjNXDzIJ. Address corroboration: https://cloudkitchenadda.com/cloud-kitchens/madurai. No ratings or opening times were copied.

The user requested yellow and red, removing the previous green. Current palette: warm yellow #FFD21C, red #B82025, white #FFFFFF and near black #111111. The exact signage yellow could not be extracted from an approved reference image; #FFD21C is an approximation pending a logo/photo or official colour value. Yellow buttons have black text; red buttons have white text.

Two original user-supplied PNGs are now included in `public`: `madurai-express-logo.png` and `madurai-express-banner.png`. They are copied byte-for-byte and displayed without cropping. The user explicitly requested both artworks as supplied, including the banner's existing parcel/logistics wording; do not reinterpret this as restaurant service configuration. The logo appears in navigation, the homepage hero when no food hero is available, and About. The full banner appears before the introduction on Home and About and can be opened at its original size.

Section/card reveals use IntersectionObserver and the Web Animations API, including newly filtered menu cards. Food imagery has a decorative steam overlay that pauses off-screen, when the tab is hidden, and for reduced-motion preferences. Logos, brand banners, restaurant-category gallery images, placeholders and enlarged gallery views do not receive steam. No food photography or demo content is newly published by these visual effects.

The one-time `npm run business:rebrand` command snapshots existing business content to ignored .local/backups, unpublishes the previous restaurant menu/gallery/offers, resets contact/settings to the new identity, and preserves administrator accounts. It is idempotent after this identity is configured. Existing draft/demo dishes are design examples, not confirmed Madurai Express dishes. Infrastructure database and bucket names are retained to preserve local data. Historical migrations retain their original defaults; the second migration updates defaults for new records.
