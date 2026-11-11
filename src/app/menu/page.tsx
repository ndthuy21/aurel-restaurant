'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, ArrowRight, Leaf, Search } from 'lucide-react';
import Link from 'next/link';
import { categories, money, type MenuItem } from '@/lib/data';
import { filterMenu, menuPage } from '@/lib/menu';
import { api } from '@/lib/client';
import { PageHeading } from '@/components/page-heading';
import { FoodPhoto, PhotoCredit } from '@/components/food-photo';
export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState('Tất cả');
  const [veg, setVeg] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const results = useRef<HTMLDivElement>(null);
  function load() {
    setLoading(true);
    setError('');
    api<MenuItem[]>('/menu')
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
  }, []);
  const filtered = filterMenu(items, category, veg, query);
  const visible = menuPage(filtered, page);
  const groups = categories.filter((c) => items.some((x) => x.available && x.category === c));
  function changePage(next: number) {
    setPage(next);
    results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <main id="main" className="section page-content">
      <PageHeading
        number="01"
        title="Trăm món Việt."
        accent="Trọn vị quê nhà."
        description="Từ món cuốn thanh nhẹ đến bún phở đậm đà và bánh chè truyền thống. Khám phá hương vị Việt theo cách của bạn."
      />
      <div className="menu-toolbar">
        <div className="tabs" aria-label="Nhóm món">
          {['Tất cả', ...groups].map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              className={category === c ? 'active' : ''}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
            >
              {c}{' '}
              <span className="category-count">
                {items.filter((x) => x.available && (c === 'Tất cả' || x.category === c)).length}
              </span>
            </button>
          ))}
        </div>
        <div className="menu-tools">
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input
              placeholder="Tên món, nguyên liệu…"
              aria-label="Tìm món ăn, có thể nhập không dấu"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={veg}
              onChange={(e) => {
                setVeg(e.target.checked);
                setPage(1);
              }}
            />
            <Leaf size={16} aria-hidden="true" /> Món chay
          </label>
        </div>
      </div>
      <div ref={results} className="menu-results-summary" aria-live="polite" role="status">
        {!loading && !error && (
          <span>
            {visible.start}–{visible.end} / {filtered.length} món{query ? ` cho “${query}”` : ''}
          </span>
        )}
        <span>Ảnh tư liệu đúng loại món; cách trình bày có thể khác. Giá mẫu, đơn vị VND.</span>
      </div>
      {loading ? (
        <p className="empty" role="status">
          Đang chuẩn bị thực đơn…
        </p>
      ) : error ? (
        <div className="error" role="alert">
          {error} <button onClick={load}>Thử lại</button>
        </div>
      ) : filtered.length ? (
        <>
          <div className="dish-grid menu-grid">
            {visible.items.map((item, index) => (
              <article className="dish-card" key={item.id}>
                <div className="dish-image">
                  <FoodPhoto key={item.image} item={item} eager={index < 3} />
                  {item.vegetarian && (
                    <span className="veg-badge">
                      <Leaf size={14} aria-hidden="true" /> CHAY
                    </span>
                  )}
                </div>
                <div className="dish-meta">
                  <span>{item.category}</span>
                  <span>{money(item.price)}</span>
                </div>
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <PhotoCredit item={item} />
              </article>
            ))}
          </div>
          {visible.pages > 1 && (
            <nav className="menu-pagination" aria-label="Phân trang thực đơn">
              <button
                className="button outline small"
                disabled={visible.current === 1}
                onClick={() => changePage(visible.current - 1)}
              >
                <ArrowLeft size={15} aria-hidden="true" /> Trang trước
              </button>
              <label>
                Trang{' '}
                <select
                  aria-label="Chọn trang thực đơn"
                  value={visible.current}
                  onChange={(e) => changePage(Number(e.target.value))}
                >
                  {Array.from({ length: visible.pages }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} / {visible.pages}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button outline small"
                disabled={visible.current === visible.pages}
                onClick={() => changePage(visible.current + 1)}
              >
                Trang sau <ArrowRight size={15} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="empty">
          <p>Chưa có món phù hợp với lựa chọn của bạn.</p>
          <button
            className="text-link"
            onClick={() => {
              setCategory('Tất cả');
              setVeg(false);
              setQuery('');
              setPage(1);
            }}
          >
            Xem toàn bộ thực đơn
          </button>
        </div>
      )}
      <aside className="menu-note">
        <div>
          <span className="eyebrow">MỘT BỮA ĂN ĐƯỢC CHUẨN BỊ RIÊNG</span>
          <h3>Bạn có yêu cầu đặc biệt?</h3>
          <p>
            Hãy cho chúng tôi biết về dị ứng hoặc chế độ ăn khi đặt bàn. Các món chay cần được xác
            nhận lại về nước chấm và nguyên liệu trước khi phục vụ.
          </p>
        </div>
        <Link className="button outline" href="/reservation">
          Đặt bàn <ArrowUpRight size={16} />
        </Link>
      </aside>
    </main>
  );
}
