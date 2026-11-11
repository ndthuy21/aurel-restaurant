import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Thực đơn' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
