import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Quản trị' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
