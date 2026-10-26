# Vercel setup and troubleshooting

The public site works without a database, using only the known contact/location defaults and a clear notice that live menu information is unavailable. This is a degraded public page, not a replacement for persistent storage. No demo dishes, stock photographs, offers or opening hours are published in production. Admin workflows require hosted PostgreSQL.

## Required production settings

In Vercel project Settings → Environment Variables, configure **Production**:

- `DATABASE_URL`: the hosted PostgreSQL connection string from your database provider. Local `localhost:5432` and Docker hostnames cannot work on Vercel. Use the provider's Prisma-compatible pooled URL and required TLS parameters.
- `APP_URL=https://madurai-express.vercel.app`
- `NEXT_PUBLIC_SITE_URL=https://madurai-express.vercel.app`
- The `S3_*` settings from `.env.example`, using your durable hosted S3-compatible service. Local MinIO/S3 sandbox URLs cannot work on Vercel.
- Keep `DEMO_PREVIEW` false or absent. Production ignores this flag regardless.

The code also uses Vercel's automatic project/deployment domain as a fallback for canonical URLs and origin checks. The build explicitly runs Prisma client generation before Next.js, including when dependencies are cached.

## Initialize the hosted database

From a trusted terminal with the hosted `DATABASE_URL` configured privately for that terminal, run:

```sh
npm run db:migrate
npm run db:seed
npm run admin:setup
```

Seed creates only categories, settings and unconfirmed draft examples. It does not publish menu items or create an admin password. Set up the production image bucket with `npm run storage:setup` using its private storage environment variables. Do not paste secrets into chat, screenshots or Git.

Redeploy after changing Vercel environment variables; existing deployments do not pick up changed variables. The runtime logs now identify missing database configuration or a failed query using only an error code, without exposing connection details.

## Relevant runtime errors

- `DATABASE_URL_MISSING`: configure the Production database environment variable.
- `P1001`: database endpoint cannot be reached; verify the hosted URL/network/TLS settings.
- `P1000`: database authentication failed; correct credentials in Vercel privately.
- `P2021` / `P2022`: schema/table/column missing; run the committed migrations on that database.
- A Prisma client initialization/build error: confirm the Vercel Build Command uses `npm run build`, which generates the client first.

If the public status notice remains after redeployment, the database is still unconfigured/unreachable or needs migrations. Check Vercel Runtime Logs. Upload failures additionally require checking hosted S3 credentials, endpoint and bucket permissions.
# Photo uploads without AWS/R2

Set the Production environment variable `IMAGE_STORAGE` to `database`. This stores compressed photos in the existing PostgreSQL database; provider quotas still apply. Apply the new migrations before uploads. If your Vercel Build Command already runs `npm run db:migrate`, redeploy after adding the variable. Otherwise, use:

```sh
DATABASE_URL="$DATABASE_URL_UNPOOLED" npm run db:migrate && npm run build
```

This command requires a real `DATABASE_URL_UNPOOLED` value. Keep the normal `DATABASE_URL` configured for runtime. Never paste database credentials into chat. Re-upload the photo in Admin → Menu after deployment completes. Old failed uploads do not contain recoverable bytes.

