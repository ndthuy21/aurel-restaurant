import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const password = randomBytes(15).toString('base64url');
try {
  await writeFile(
    '.env.local',
    `DATA_MODE=local\nLOCAL_ADMIN_EMAIL=admin@aurel.local\nLOCAL_ADMIN_PASSWORD=${password}\nSESSION_SECRET=${randomBytes(48).toString('hex')}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  console.log('Created .env.local. Admin: admin@aurel.local. Password is in .env.local.');
} catch (e) {
  if (e.code === 'EEXIST') console.log('.env.local exists; preserved.');
  else throw e;
}
