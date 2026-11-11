import { ApiError } from '../lib/schema';
export function assertOrigin(origin: string | null, host: string | null, protocol: string) {
  const expected = process.env.APP_ORIGIN || `${protocol}//${host}`;
  if (!origin || origin !== expected) throw new ApiError(403, 'Origin không hợp lệ');
}
