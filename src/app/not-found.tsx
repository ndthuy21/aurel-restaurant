import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export default function NotFound() {
  return (
    <main id="main" className="section page-content empty">
      <span className="eyebrow">404</span>
      <h1>
        Góc nhỏ này <em>chưa có.</em>
      </h1>
      <p>Trở về Aurel để tiếp tục khám phá.</p>
      <Link className="button gold" href="/">
        Về trang chủ <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </main>
  );
}
