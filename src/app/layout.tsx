import type { Metadata } from 'next';
import { Chrome } from '@/components/chrome';
import { sans, serif } from './fonts';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://aurel.example'),
  title: { default: 'AUREL · Một buổi tối đáng nhớ', template: '%s | AUREL' },
  description:
    'Website nhà hàng minh họa: ẩm thực đương đại, không gian ấm áp và những buổi tối đáng nhớ.',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
