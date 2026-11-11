import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { FileStore } from '../src/server/store';
import { service, errorResponse } from '../src/server/service';
import { reservationSchema } from '../src/lib/schema';
import { seedMenu } from '../src/lib/data';
import { login, localAdmin } from '../src/server/auth';
const ctx = { admin: false, ip: '127.0.0.1' };
const admin = { ...ctx, admin: true };
const booking = (guests = 2) => ({
  id: randomUUID(),
  name: 'Khách kiểm thử',
  email: 'test@example.com',
  phone: '0901234567',
  date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  time: '19:00',
  guests,
  notes: '',
  website: '',
  consent: true as const,
});
let dir: string;
let store: FileStore;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'aurel-test-'));
  store = new FileStore(join(dir, 'db.json'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});
describe('public API and persistence', () => {
  it('starts with the full catalog and persists changes across instances', async () => {
    expect(await service('GET', '/menu', undefined, ctx, store)).toHaveLength(seedMenu.length);
    await service('POST', '/admin/menu', { ...seedMenu[0], name: 'Món đã sửa' }, admin, store);
    expect(
      (await new FileStore(join(dir, 'db.json')).get<{ name: string }>('menu', seedMenu[0].id))
        ?.name,
    ).toBe('Món đã sửa');
    expect((await store.get<{ photo: unknown }>('menu', seedMenu[0].id))?.photo).toEqual(
      seedMenu[0].photo,
    );
  });
  it('valid reservation is stored as pending and duplicate UUID does not insert again', async () => {
    const b = booking();
    await service('POST', '/reservations', b, ctx, store);
    await service('POST', '/reservations', b, ctx, store);
    const rows = await store.list<{ status: string }>('reservations');
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('pending');
  });
  it('rejects impossible dates, past dates, invalid time, oversized group and honeypot', () => {
    for (const change of [
      { date: '2026-02-30' },
      { date: '2020-01-01' },
      { time: '03:00' },
      { guests: 9 },
      { website: 'bot.test' },
      { consent: false },
    ])
      expect(reservationSchema.safeParse({ ...booking(), ...change }).success).toBe(false);
  });
  it('requires a 30 minute lead time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-02T11:50:00Z'));
    expect(
      reservationSchema.safeParse({ ...booking(), date: '2026-11-02', time: '19:00' }).success,
    ).toBe(false);
    vi.useRealTimers();
  });
  it('rejects malformed contact data', async () => {
    await expect(service('POST', '/contact', { name: 'x' }, ctx, store)).rejects.toThrow();
  });
  it('stores contact messages', async () => {
    await service(
      'POST',
      '/contact',
      {
        name: 'Khách mẫu',
        email: 'test@example.com',
        message: 'Tôi muốn hỏi về bữa tối.',
        consent: true,
      },
      ctx,
      store,
    );
    expect(await service('GET', '/admin/contacts', undefined, admin, store)).toHaveLength(1);
  });
  it('rate limits public submissions', async () => {
    for (let i = 0; i < 5; i++) await service('POST', '/reservations', booking(1), ctx, store);
    await expect(service('POST', '/reservations', booking(1), ctx, store)).rejects.toMatchObject({
      status: 429,
    });
  });
});
describe('authorization and CRUD', () => {
  it.each([
    ['GET', '/admin/reservations'],
    ['GET', '/admin/contacts'],
    ['POST', '/admin/menu'],
    ['PATCH', '/admin/reservations/' + randomUUID()],
    ['POST', '/admin/media'],
  ])('blocks unauthenticated %s %s', async (method, path) => {
    await expect(service(method, path, {}, ctx, store)).rejects.toMatchObject({ status: 401 });
  });
  it('hides unavailable menu items, validates and deletes menu records', async () => {
    await service('POST', '/admin/menu', { ...seedMenu[0], available: false }, admin, store);
    expect(await service('GET', '/menu', undefined, ctx, store)).toHaveLength(seedMenu.length - 1);
    await expect(
      service('POST', '/admin/menu', { ...seedMenu[0], price: -1 }, admin, store),
    ).rejects.toThrow();
    await service('DELETE', '/admin/menu/' + seedMenu[0].id, undefined, admin, store);
    expect(await store.list('menu')).toHaveLength(seedMenu.length - 1);
  });
  it('rejects unknown status and missing reservation', async () => {
    await expect(
      service('PATCH', '/admin/reservations/' + randomUUID(), { status: 'hacked' }, admin, store),
    ).rejects.toThrow();
    await expect(
      service(
        'PATCH',
        '/admin/reservations/' + randomUUID(),
        { status: 'confirmed' },
        admin,
        store,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
  it('local authentication requires configured password and signed session', async () => {
    vi.stubEnv('LOCAL_ADMIN_EMAIL', 'admin@example.com');
    vi.stubEnv('LOCAL_ADMIN_PASSWORD', 'A-secure-test-password');
    vi.stubEnv('SESSION_SECRET', 'a'.repeat(64));
    const token = await login('admin@example.com', 'A-secure-test-password');
    expect(await localAdmin(token)).toBe(true);
    expect(await localAdmin(token + 'x')).toBe(false);
    expect(await localAdmin()).toBe(false);
    await expect(login('admin@example.com', 'wrong')).rejects.toMatchObject({ status: 401 });
  });
  it('does not expose internal exception text', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(errorResponse(new Error('secret database address')).body.error).not.toContain('secret');
    vi.restoreAllMocks();
  });
});
describe('capacity under competing requests', () => {
  it('atomically caps a slot at 24 guests', async () => {
    const rows = Array.from({ length: 8 }, () => ({
      ...booking(8),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    }));
    const result = await Promise.allSettled(rows.map((r) => store.reserve(r)));
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    expect(await store.list('reservations')).toHaveLength(3);
  });
  it('cancellation releases capacity; reopening a full slot fails', async () => {
    const rows = Array.from({ length: 3 }, () => ({
      ...booking(8),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    }));
    for (const r of rows) await store.reserve(r);
    await store.status(rows[0].id, 'cancelled');
    await store.reserve({ ...booking(8), status: 'pending', createdAt: new Date().toISOString() });
    await expect(store.status(rows[0].id, 'confirmed')).rejects.toMatchObject({ status: 409 });
    await store.status(rows[1].id, 'confirmed');
    expect(await store.get('reservations', rows[1].id)).toMatchObject({ status: 'confirmed' });
  });
});

describe('same origin protection', () => {
  it('uses the incoming Host for local loopback instead of normalized Next URL', async () => {
    const { assertOrigin } = await import('../src/server/http');
    expect(() => assertOrigin('http://127.0.0.1:3000', '127.0.0.1:3000', 'http:')).not.toThrow();
    expect(() => assertOrigin('https://attacker.example', '127.0.0.1:3000', 'http:')).toThrow();
    expect(() => assertOrigin(null, '127.0.0.1:3000', 'http:')).toThrow();
  });
  it('uses an explicit deployment origin behind an AWS proxy', async () => {
    vi.stubEnv('APP_ORIGIN', 'https://aurel.example');
    const { assertOrigin } = await import('../src/server/http');
    expect(() =>
      assertOrigin('https://aurel.example', 'internal.amazonaws.com', 'http:'),
    ).not.toThrow();
    expect(() =>
      assertOrigin('https://attacker.example', 'internal.amazonaws.com', 'http:'),
    ).toThrow();
  });
});

describe('S3 signed uploads', () => {
  it('binds MIME type and content length to a short-lived URL without an empty-body checksum', async () => {
    vi.stubEnv('DATA_MODE', 'aws');
    vi.stubEnv('AWS_REGION', 'ap-southeast-1');
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'test-key');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'test-secret');
    vi.stubEnv('MEDIA_BUCKET', 'aurel-test-bucket');
    const result = (await service(
      'POST',
      '/admin/media',
      { contentType: 'image/png', size: 1024 },
      admin,
      store,
    )) as { uploadUrl: string; previewUrl: string };
    const url = new URL(result.uploadUrl);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('120');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toContain('content-length');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toContain('content-type');
    expect(url.searchParams.has('x-amz-checksum-crc32')).toBe(false);
    expect(new URL(result.previewUrl).searchParams.get('X-Amz-Expires')).toBe('900');
  });
  it('rejects SVG files and oversized uploads before signing', async () => {
    vi.stubEnv('DATA_MODE', 'aws');
    for (const body of [
      { contentType: 'image/svg+xml', size: 1 },
      { contentType: 'image/png', size: 5000001 },
    ])
      expect(
        await service('POST', '/admin/media', body, admin, store).catch(errorResponse),
      ).toMatchObject({ status: 400 });
  });
});
