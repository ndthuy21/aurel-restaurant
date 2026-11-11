import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const temp = await mkdtemp(join(tmpdir(), 'aurel-http-'));
const base = 'http://127.0.0.1:3100';
const password = randomBytes(24).toString('hex');
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3100'],
  {
    env: {
      ...process.env,
      DATA_MODE: 'local',
      LOCAL_DATA_PATH: join(temp, 'db.json'),
      LOCAL_ADMIN_EMAIL: 'smoke@aurel.local',
      LOCAL_ADMIN_PASSWORD: password,
      SESSION_SECRET: randomBytes(48).toString('hex'),
      APP_ORIGIN: base,
    },
    stdio: 'ignore',
  },
);
let checks = 0;
async function request(path, { method = 'GET', body, token, origin = base } = {}) {
  const r = await fetch(base + '/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      ...(token ? { Cookie: token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { r, data: await r.json() };
}
function check(value, expected) {
  assert.deepEqual(value, expected);
  checks++;
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(100);
  }
  assert(ready, 'Production server did not start');
  for (const path of ['/', '/menu', '/gallery', '/about', '/contact', '/reservation', '/admin']) {
    check((await fetch(base + path)).status, 200);
  }
  check((await request('/admin/reservations')).r.status, 401);
  check(
    (await request('/contact', { method: 'POST', body: {}, origin: 'https://evil.example' })).r
      .status,
    403,
  );
  check((await request('/contact', { method: 'POST', body: {} })).r.status, 400);
  const malformed = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: '{broken',
  });
  check(malformed.status, 400);
  const oversized = await request('/contact', {
    method: 'POST',
    body: { message: 'a'.repeat(17000) },
  });
  check(oversized.r.status, 413);
  check((await request('/menu')).data.length, 100);
  const auth = await request('/auth/login', {
    method: 'POST',
    body: { email: 'smoke@aurel.local', password },
  });
  check(auth.r.status, 200);
  const cookie = auth.r.headers.get('set-cookie');
  assert(
    cookie.includes('HttpOnly') && cookie.includes('SameSite=strict') && cookie.includes('Secure'),
  );
  checks++;
  const token = cookie.split(';')[0];
  check((await request('/admin/session', { token })).r.status, 200);
  const booking = {
    id: randomUUID(),
    name: 'HTTP Smoke Test',
    email: 'test@example.com',
    phone: '0901234567',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time: '19:00',
    guests: 2,
    notes: 'Test only',
    consent: true,
    website: '',
  };
  check((await request('/reservations', { method: 'POST', body: booking })).r.status, 200);
  await request('/reservations', { method: 'POST', body: booking });
  let rows = await request('/admin/reservations', { token });
  check(rows.data.length, 1);
  check(rows.data[0].status, 'pending');
  check(
    (
      await request('/admin/reservations/' + booking.id, {
        method: 'PATCH',
        body: { status: 'confirmed' },
        token,
      })
    ).r.status,
    200,
  );
  rows = await request('/admin/reservations', { token });
  check(rows.data[0].status, 'confirmed');
  const dish = {
    ...(await request('/menu')).data[0],
    id: 'smoke-dish',
    name: 'Smoke dish',
    available: false,
  };
  check((await request('/admin/menu', { method: 'POST', body: dish, token })).r.status, 200);
  check((await request('/admin/menu', { token })).data.length, 101);
  check((await request('/menu')).data.length, 100);
  check((await request('/admin/menu/smoke-dish', { method: 'DELETE', token })).r.status, 200);
  check(
    (
      await request('/contact', {
        method: 'POST',
        body: {
          name: 'Smoke Test',
          email: 'test@example.com',
          message: 'Message for smoke test only',
          consent: true,
        },
      })
    ).r.status,
    200,
  );
  check((await request('/admin/contacts', { token })).data.length, 1);
  check((await request('/auth/logout', { method: 'POST', body: {}, token })).r.status, 200);
  console.log(
    `PASS: ${checks} HTTP assertions against the production build; temporary data removed.`,
  );
} finally {
  server.kill('SIGTERM');
  await new Promise((r) => (server.exitCode !== null ? r() : server.once('exit', r)));
  await rm(temp, { recursive: true, force: true });
}
