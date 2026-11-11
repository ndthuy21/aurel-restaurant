export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base =
    path.startsWith('/admin/') || path.startsWith('/auth/')
      ? '/api'
      : process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  const r = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  });
  const data = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(data.error || 'Không thể kết nối. Vui lòng thử lại.'), {
      status: r.status,
    });
  return data;
}
