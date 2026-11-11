import { createHash, randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ApiError,
  reservationSchema,
  contactSchema,
  menuSchema,
  mediaSchema,
  statusSchema,
  type Reservation,
} from '../lib/schema';
import { getStore, type Store } from './store';
import type { MenuItem } from '../lib/data';
export type Context = { admin: boolean; ip: string };
export async function notify(email: string, id: string) {
  if (process.env.DATA_MODE !== 'aws' || !process.env.SES_FROM) return;
  // Best-effort notification. The persisted request remains the source of truth.
  try {
    await new SESv2Client({}).send(
      new SendEmailCommand({
        FromEmailAddress: process.env.SES_FROM,
        Destination: { ToAddresses: [email] },
        Content: {
          Simple: {
            Subject: { Data: 'AUREL · Đã nhận yêu cầu đặt bàn' },
            Body: {
              Text: {
                Data: `Mã yêu cầu: ${id}. Nhà hàng sẽ xác nhận riêng. Đây là thư từ ứng dụng minh họa AUREL.`,
              },
            },
          },
        },
      }),
    );
  } catch (e) {
    console.error('SES delivery failed', { id, error: (e as Error).name });
  }
}
export async function service(
  method: string,
  path: string,
  body: unknown,
  ctx: Context,
  store: Store = getStore(),
) {
  if (path.startsWith('/admin') && !ctx.admin)
    throw new ApiError(401, 'Vui lòng đăng nhập bằng tài khoản admin');
  if (method === 'GET' && path === '/menu')
    return (await store.list<MenuItem>('menu')).filter((x) => x.available);
  if (method === 'POST' && (path === '/reservations' || path === '/contact')) {
    const data =
      path === '/reservations' ? reservationSchema.parse(body) : contactSchema.parse(body);
    const bucket = Math.floor(Date.now() / 900000);
    const hash = (v: string) =>
      createHash('sha256')
        .update(v + '|' + bucket)
        .digest('hex');
    await store.limit(hash('ip:' + ctx.ip), 30);
    await store.limit(hash('email:' + data.email.toLowerCase()), 5);
    if (path === '/reservations') {
      const r = {
        ...reservationSchema.parse(body),
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      const created = await store.reserve(r);
      if (created) await notify(r.email, r.id);
      return { id: r.id, message: 'Đã nhận yêu cầu. Nhà hàng sẽ liên hệ xác nhận.' };
    }
    const id = randomUUID();
    await store.put('contacts', { ...data, id, createdAt: new Date().toISOString() });
    return { id, message: 'Đã nhận lời nhắn của bạn.' };
  }
  if (method === 'GET' && path === '/admin/session') return { admin: true };
  if (method === 'GET' && path === '/admin/reservations')
    return store.list<Reservation>('reservations');
  if (method === 'GET' && path === '/admin/contacts') return store.list('contacts');
  if (method === 'GET' && path === '/admin/menu') return store.list<MenuItem>('menu');
  if (method === 'POST' && path === '/admin/menu') {
    const item = menuSchema.parse(body);
    await store.put('menu', item);
    return item;
  }
  if (method === 'DELETE' && /^\/admin\/menu\/[a-z0-9-]+$/.test(path)) {
    await store.remove('menu', path.split('/').pop()!);
    return { ok: true };
  }
  if (method === 'PATCH' && /^\/admin\/reservations\/[a-f0-9-]{36}$/.test(path)) {
    const { status } = statusSchema.parse(body);
    await store.status(path.split('/').pop()!, status);
    return { ok: true };
  }
  if (method === 'POST' && path === '/admin/media') {
    if (process.env.DATA_MODE !== 'aws')
      throw new ApiError(400, 'Upload S3 chỉ khả dụng trong chế độ AWS.');
    const b = mediaSchema.parse(body);
    const key = 'uploads/' + randomUUID();
    const s3 = new S3Client({ requestChecksumCalculation: 'WHEN_REQUIRED' });
    return {
      key,
      uploadUrl: await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: process.env.MEDIA_BUCKET,
          Key: key,
          ContentType: b.contentType,
          ContentLength: b.size,
        }),
        { expiresIn: 120, signableHeaders: new Set(['content-type', 'content-length']) },
      ),
      previewUrl: await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: process.env.MEDIA_BUCKET, Key: key }),
        { expiresIn: 900 },
      ),
    };
  }
  throw new ApiError(404, 'Không tìm thấy API');
}
export function errorResponse(e: unknown) {
  if (e instanceof ZodError)
    return { status: 400, body: { error: e.issues[0]?.message || 'Dữ liệu không hợp lệ' } };
  if (e instanceof ApiError) return { status: e.status, body: { error: e.message } };
  console.error('API error', { name: (e as Error)?.name });
  return { status: 500, body: { error: 'Có lỗi hệ thống. Vui lòng thử lại sau.' } };
}
