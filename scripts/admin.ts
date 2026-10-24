import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { stdin, stdout } from 'node:process';
import { hash } from 'bcryptjs';
import { db } from '../lib/db';
import { z } from 'zod';
let hide = false;
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!hide) stdout.write(chunk);
    callback();
  },
});
const rl = createInterface({ input: stdin, output, terminal: true });
async function main() {
  const email = z
    .string()
    .email()
    .parse((await rl.question('Admin email: ')).trim().toLowerCase());
  stdout.write('New password (minimum 14 characters; hidden): ');
  hide = true;
  const password = await rl.question('');
  stdout.write('\nConfirm password: ');
  const confirm = await rl.question('');
  hide = false;
  stdout.write('\n');
  if (password.length < 14 || Buffer.byteLength(password, 'utf8') > 72 || password !== confirm)
    throw new Error(
      'Passwords must match, contain at least 14 characters and fit within 72 UTF-8 bytes.',
    );
  if (await db.admin.findUnique({ where: { email } }))
    throw new Error('Administrator already exists. Use the documented password reset script.');
  await db.admin.create({ data: { email, passwordHash: await hash(password, 12) } });
  console.log('Administrator created. Sign in at /admin/login.');
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await db.$disconnect();
  });
