import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { login, localAdmin, cookieName, revoke } from '@/server/auth';
import { service, errorResponse } from '@/server/service';
import { ApiError } from '@/lib/schema';
import { assertOrigin } from '@/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const attempts = new Map<string, { count: number; until: number }>();
async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const path = '/' + (await params).path.join('/');
    const method = req.method;
    if (!['GET', 'HEAD'].includes(method)) {
      assertOrigin(req.headers.get('origin'), req.headers.get('host'), req.nextUrl.protocol);
      if (Number(req.headers.get('content-length') || 0) > 16384)
        throw new ApiError(413, 'Yêu cầu quá lớn');
    }
    const jar = await cookies();
    const token = jar.get(cookieName)?.value;
    if (path === '/auth/logout' && method === 'POST') {
      if (token) await revoke(token);
      jar.delete(cookieName);
      return NextResponse.json({ ok: true });
    }
    let body: unknown = undefined;
    if (!['GET', 'HEAD', 'DELETE'].includes(method)) {
      const raw = await req.text();
      if (Buffer.byteLength(raw, 'utf8') > 16384) throw new ApiError(413, 'Yêu cầu quá lớn');
      try {
        body = JSON.parse(raw);
      } catch {
        throw new ApiError(400, 'JSON không hợp lệ');
      }
    }
    if (path === '/auth/login' && method === 'POST') {
      const b = z
        .object({ email: z.string().email().max(200), password: z.string().min(1).max(256) })
        .parse(body);
      const now = Date.now();
      for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
      const k = b.email.toLowerCase();
      const a = attempts.get(k) || { count: 0, until: now + 900000 };
      if (a.count >= 10) throw new ApiError(429, 'Thử lại sau 15 phút');
      a.count++;
      attempts.set(k, a);
      const value = await login(b.email, b.password);
      if (process.env.DATA_MODE === 'aws') {
        const r = await fetch(process.env.API_BASE_URL + '/admin/session', {
          headers: { Authorization: 'Bearer ' + value },
          cache: 'no-store',
        });
        if (!r.ok) throw new ApiError(403, 'Tài khoản chưa thuộc nhóm admin');
      }
      attempts.delete(k);
      jar.set(cookieName, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600,
      });
      return NextResponse.json({ ok: true });
    }
    if (process.env.DATA_MODE === 'aws') {
      if (!path.startsWith('/admin/')) throw new ApiError(404, 'Sử dụng API public được cấu hình');
      if (!token) throw new ApiError(401, 'Vui lòng đăng nhập');
      const r = await fetch(process.env.API_BASE_URL + path, {
        method,
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      return new NextResponse(await r.text(), {
        status: r.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
    const result = await service(method, path, body, {
      admin: await localAdmin(token),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0] || 'local',
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const r = errorResponse(e);
    return NextResponse.json(r.body, {
      status: r.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
