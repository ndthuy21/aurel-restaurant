'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
const links = [
  ['/', 'Trang chủ'],
  ['/menu', 'Thực đơn'],
  ['/gallery', 'Không gian'],
  ['/about', 'Câu chuyện'],
  ['/contact', 'Liên hệ'],
];
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Aurel trang chủ">
      AUREL<span>DINING & WINE</span>
    </Link>
  );
}
export function Chrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  if (path.startsWith('/admin')) return <>{children}</>;
  return (
    <>
      <a className="skip" href="#main">
        Đến nội dung
      </a>
      <header className="site-header">
        <Brand />
        <nav aria-label="Điều hướng chính" className={open ? 'navigation open' : 'navigation'}>
          {links.map(([url, label]) => (
            <Link
              key={url}
              href={url}
              aria-current={path === url ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="button gold header-book" href="/reservation">
          Đặt bàn <ArrowUpRight size={14} />
        </Link>
        <button
          className="icon-button mobile-toggle"
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {children}
      <footer className="footer">
        <div className="footer-top">
          <div>
            <Brand />
            <p>Một cuộc hẹn với những điều tinh tế.</p>
          </div>
          <div>
            <span className="eyebrow">GHÉ THĂM AUREL</span>
            <p>
              24 Đường Ánh Trăng, Quận 1<br />
              TP. Hồ Chí Minh · Địa chỉ minh họa
            </p>
            <Link href="/contact">
              Thông tin liên hệ <ArrowUpRight size={14} />
            </Link>
          </div>
          <div>
            <span className="eyebrow">GIỜ ĐÓN KHÁCH</span>
            <p>
              Mỗi ngày · 17:30 – 22:30
              <br />
              Nhận đặt bàn trước 30 phút
            </p>
            <Link href="/reservation">
              Dành một chỗ cho bạn <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AUREL. Thương hiệu & nội dung minh họa.</span>
          <span>Ảnh tư liệu: Wikimedia Commons; nguồn tại Thực đơn và Không gian.</span>
          <Link href="/admin" className="inline-flex items-center gap-2">
            Quản trị <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </>
  );
}
