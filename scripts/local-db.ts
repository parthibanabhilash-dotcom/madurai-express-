import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import path from 'node:path';
const databaseDir = path.resolve('.local/postgres');
const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'madurai',
  password: 'local-development-only',
  port: 5432,
  persistent: true,
  authMethod: 'scram-sha-256',
  postgresFlags: ['-h', '127.0.0.1'],
  onLog: () => {},
  onError: () => {},
});
async function main() {
  if (!existsSync(path.join(databaseDir, 'PG_VERSION'))) await pg.initialise();
  await pg.start();
  const client = pg.getPgClient();
  await client.connect();
  for (const name of ['madurai', 'madurai_test']) {
    const r = await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [name]);
    if (!r.rowCount) await pg.createDatabase(name);
  }
  await client.end();
  console.log(
    'Local PostgreSQL ready on 127.0.0.1:5432. Databases: madurai, madurai_test. Keep this terminal open.',
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, async () => {
    await pg.stop();
    process.exit(0);
  });
