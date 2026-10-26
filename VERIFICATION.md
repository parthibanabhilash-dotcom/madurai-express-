# Local verification

## Vercel availability fix — 26 October 2026

The reported live deployment returned HTTP 500 and a localhost canonical URL. Exact provider-side database error remains unconfirmed without private runtime logs. Code inspection identified that any production database error crashed every public route, and Prisma client generation was not explicitly part of the build.

Fixed: public queries now return only known contact/location defaults and a clear live-menu-unavailable notice when the database is missing/unreachable. Production never enables demo data. Queries are deduplicated within each render; error logs expose only a diagnostic code/name. Prisma generation runs during installation/build. Canonical URLs, sitemap, robots and origin checks use configured/Vercel domains. Hosted PostgreSQL and migrations remain required for admin workflows; see VERCEL_SETUP.md.

Validated: TypeScript, optimized build, 23 behavior/UI/deployment regression tests and 9 PostgreSQL/S3 integration tests (**32 total**). Ran production HTTP checks against both a healthy database and an explicitly missing DATABASE_URL with DEMO_PREVIEW=true: five public routes, sitemap and robots returned 200, anonymous admin remained protected, outage notice appeared only during the outage, no demo content leaked, and the homepage canonical used the Vercel domain.

## Madurai Express update

The site has been rebranded to MADURAI EXPRESS from the user-supplied Google share link. Public/admin wordmarks, titles, descriptions, structured data, placeholder artwork, phone and map search have been updated. Yellow is now #FFD21C and red is #B82025; the green brand palette was removed. The exact signage yellow remains an approximation pending an approved logo/photo.

The new phone/address were sourced from the matching public listing and recorded in README.md. Full address and map pin remain pending owner confirmation. No verified Swiggy URL was found for this branch: the previous restaurant link was removed, ordering is disabled by default, and mobile Enquire calls the new number. Existing business content was backed up locally and unpublished; administrator accounts were preserved. A second SQL migration updates identity defaults. Historical migration files remain unchanged.

Rebrand checks: TypeScript, 16 behavior/UI tests and 9 PostgreSQL/S3 integration tests, including the newly disabled-order fallback. The production build and HTTP checks are repeated after the update.

Verified on 24 October 2026 in `C:\Users\Admin\Desktop\Demo`, using Node.js 24, Next.js 16, Prisma 6 and actual PostgreSQL 17.

## Passed

- Prisma client generation and initial SQL migration applied to the restaurant database and a separate `madurai_test` database.
- Seed creates six categories and eight unconfirmed draft dishes, with no prices or availability claims.
- TypeScript check and optimized production build.
- **15 behavior/UI tests:** search, combined category/classification filters, reset, demo publication rejection, price validation, offer boundaries and IST conversion, URL/hours validation, image type/size/content/dimension checks, image re-encoding, mobile menu toggle/Escape/focus, active navigation and action links, and gallery enlargement/keyboard navigation/focus restoration.
- **9 PostgreSQL integration tests:** authorization, CSRF/origin rejection, category/menu CRUD, prices, publishing, availability/featured updates, category dependency protection, offers, settings persistence, invalid uploads, S3 upload/retrieval and gallery publication/access control, login/logout, opaque sessions, expired sessions and login throttling.
- Real image objects were written to and read from a loopback S3-compatible sandbox; fixture database records and objects were cleaned up.
- Production HTTP checks: all five public pages, sitemap and robots returned 200; anonymous `/admin` redirected to login. Demo banner, demo stock image references and provisional menu cards were absent from production responses despite `DEMO_PREVIEW=true` in local configuration.
- `npm audit --omit=dev`: **0 vulnerabilities**.

## Verification limits

No browser is connected to this environment. Browser screenshots and visual layout verification at 360px, 768px and 1440px could not be performed. Responsive CSS has explicit mobile/tablet/desktop rules, safe-area padding and reduced-motion handling. UI tests use a DOM environment; they do not establish pixel layout, real device behavior or native dialog focus trapping. These checks should be completed in a browser before external release.

Docker is not installed. PostgreSQL integration was verified using the included bundled PostgreSQL runner, not the Compose container. S3 integration was verified against S3rver, not the MinIO container or an external production storage provider. MinIO/S3 configuration remains supplied and configurable. The official MinIO Windows binary URL returned HTTP 410, so no binary was installed.

Full development dependency audit currently reports four advisories (one moderate, three high) in the optional local S3rver sandbox dependency tree (`busboy`/`dicer` and `fast-xml-parser`). This sandbox binds to loopback and explicitly refuses production mode. It is a development/test facility; do not expose it or use it as production storage. No production dependency advisories were reported.

The supplied visual reference was reachable by HTTP, and its HTML/styles were inspected. The browser surface was unavailable, so reference scrolling and interactions were not visually inspected. No reference images were copied.

No administrator password was preconfigured. Run `npm run admin:setup` to create your administrator securely. No deployment was performed.

## Repeat checks

Use the commands in README.md. Tests with S3 require the configured service and `TEST_S3=true`. Integration tests refuse a database name without the `_test` suffix. Browser release checks should cover all five pages at the three target widths, touch navigation, keyboard focus, native gallery dialog behavior, reduced motion, uploads from the admin UI and opening the external phone/Maps/Swiggy links on a real device.
