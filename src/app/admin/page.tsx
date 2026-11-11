'use client';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ArrowLeft,
  CalendarDays,
  UtensilsCrossed,
  Mail,
  ImagePlus,
  LogOut,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { Brand } from '@/components/chrome';
import { api } from '@/lib/client';
import { categories, money, seedMenu, type MenuItem } from '@/lib/data';
import type { Reservation, Contact } from '@/lib/schema';
const blank: MenuItem = {
  id: '',
  name: '',
  description: '',
  price: 0,
  category: 'Khai vị',
  available: true,
  vegetarian: false,
  image: '/images/plate.svg',
};
export default function Admin() {
  const [session, setSession] = useState<'loading' | 'guest' | 'admin'>('loading');
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Reservation[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState('');
  const [media, setMedia] = useState('');
  const [notice, setNotice] = useState('');
  function fail(e: unknown) {
    if ((e as { status?: number }).status === 401) setSession('guest');
    setError((e as Error).message);
  }
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const [r, m, c] = await Promise.all([
        api<Reservation[]>('/admin/reservations'),
        api<MenuItem[]>('/admin/menu'),
        api<Contact[]>('/admin/contacts'),
      ]);
      setRows(r.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setMenu(m);
      setContacts(c.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    api('/admin/session')
      .then(() => setSession('admin'))
      .catch(() => setSession('guest'));
  }, []);
  useEffect(() => {
    if (session === 'admin') void refresh();
  }, [session]);
  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
      });
      setSession('admin');
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await api('/auth/logout', { method: 'POST', body: '{}' });
      setSession('guest');
      setRows([]);
      setMenu([]);
      setContacts([]);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function status(id: string, value: string) {
    setBusy(true);
    setError('');
    try {
      await api('/admin/reservations/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ status: value }),
      });
      await refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      await api('/admin/menu', { method: 'POST', body: JSON.stringify(editing) });
      setEditing(null);
      setNotice('Đã lưu món ăn.');
      await refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError('');
    try {
      await api('/admin/menu/' + id, { method: 'DELETE' });
      setDeleting('');
      await refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError('');
    setMedia('');
    try {
      if (file.size > 5000000) throw new Error('Ảnh tối đa 5 MB');
      const r = await api<{ uploadUrl: string; previewUrl: string; key: string }>('/admin/media', {
        method: 'POST',
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const response = await fetch(r.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) throw new Error('Upload không thành công');
      setMedia(r.previewUrl);
      setNotice('Đã tải lên S3. Ảnh xem trước có hiệu lực 15 phút. Key: ' + r.key);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  const pending = rows.filter((x) => x.status === 'pending').length;
  const visible = rows.filter(
    (x) =>
      (filter === 'all' || x.status === filter) &&
      (x.name + ' ' + x.email + ' ' + x.id).toLowerCase().includes(search.toLowerCase()),
  );
  if (session === 'loading')
    return (
      <main className="admin-loading" role="status">
        Đang kiểm tra phiên đăng nhập…
      </main>
    );
  if (session === 'guest')
    return (
      <main className="admin-login">
        <div className="login-art">
          <Brand />
          <div>
            <span className="eyebrow">AUREL · BACK OFFICE</span>
            <h1>
              Phía sau một
              <br />
              buổi tối <em>trọn vẹn.</em>
            </h1>
            <p>Không gian làm việc dành cho đội ngũ nhà hàng.</p>
          </div>
          <span className="fine-print">Ứng dụng minh họa · Dữ liệu được lưu qua backend</span>
        </div>
        <div className="login-form">
          <form onSubmit={signIn} className="form">
            <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
            <h2>
              Đăng nhập <em>quản trị.</em>
            </h2>
            <label>
              Email
              <input type="email" name="email" autoComplete="username" required />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                maxLength={256}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button gold full" disabled={busy}>
              {busy ? 'Đang xác thực…' : 'Đăng nhập'}
              <ArrowUpRight size={16} />
            </button>
            <p className="fine-print">
              Tài khoản do người vận hành thiết lập. Chế độ AWS dùng tài khoản Cognito thuộc nhóm
              admin.
            </p>
            <a className="text-link" href="/">
              <ArrowLeft size={16} aria-hidden="true" /> Về website
            </a>
          </form>
        </div>
      </main>
    );
  const nav = [
    ['overview', 'Tổng quan', LayoutDashboard],
    ['reservations', 'Đặt bàn', CalendarDays],
    ['menu', 'Thực đơn', UtensilsCrossed],
    ['contacts', 'Lời nhắn', Mail],
    ['media', 'Thư viện S3', ImagePlus],
  ] as const;
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Brand />
        <span className="eyebrow">KHÔNG GIAN QUẢN TRỊ</span>
        <nav aria-label="Quản trị">
          {nav.map(([id, label, Icon]) => (
            <button
              className={tab === id ? 'active' : ''}
              key={id}
              onClick={() => {
                setTab(id);
                setNotice('');
                setEditing(null);
              }}
            >
              <Icon size={18} />
              {label}
              {id === 'reservations' && pending > 0 && <b>{pending}</b>}
            </button>
          ))}
        </nav>
        <button className="sidebar-logout" disabled={busy} onClick={logout}>
          <LogOut size={17} />
          Đăng xuất
        </button>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <span className="eyebrow">AUREL / QUẢN TRỊ</span>
            <h1>{nav.find((n) => n[0] === tab)?.[1]}</h1>
          </div>
          <button className="button outline small" disabled={busy} onClick={refresh}>
            <RefreshCw size={15} className={busy ? 'spin' : ''} />
            Làm mới
          </button>
        </header>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {tab === 'overview' && (
          <>
            <div className="stat-grid">
              {[
                ['Yêu cầu đặt bàn', rows.length, 'Tất cả yêu cầu đã lưu'],
                ['Chờ xác nhận', pending, 'Cần đội ngũ phản hồi'],
                [
                  'Món đang phục vụ',
                  menu.filter((x) => x.available).length,
                  'Hiển thị trên thực đơn',
                ],
                ['Lời nhắn', contacts.length, 'Từ form liên hệ'],
              ].map(([t, n, d]) => (
                <div className="stat" key={t}>
                  <span>{t}</span>
                  <strong>{n}</strong>
                  <small>{d}</small>
                </div>
              ))}
            </div>
            <div className="admin-panel">
              <div className="panel-title">
                <h2>Cuộc hẹn gần đây</h2>
                <button className="text-link" onClick={() => setTab('reservations')}>
                  Xem tất cả <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </div>
              {rows.length ? (
                rows.slice(0, 5).map((r) => (
                  <div className="recent" key={r.id}>
                    <div>
                      <strong>{r.name}</strong>
                      <p>
                        {r.date} · {r.time} · {r.guests} khách
                      </p>
                    </div>
                    <span className={'badge ' + r.status}>
                      {
                        { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy' }[
                          r.status
                        ]
                      }
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty">Chưa có yêu cầu đặt bàn. Hãy thử form đặt bàn trên website.</p>
              )}
            </div>
            <p className="fine-print">
              Yêu cầu mới có trạng thái chờ xác nhận. Chỉ xác nhận sau khi đã kiểm tra thông tin với
              khách.
            </p>
          </>
        )}
        {tab === 'reservations' && (
          <div className="admin-panel">
            <div className="admin-filters">
              <label>
                Tìm khách hoặc mã
                <input
                  aria-label="Tìm đặt bàn"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên, email, mã đặt bàn…"
                />
              </label>
              <label>
                Trạng thái
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </label>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Cuộc hẹn</th>
                    <th>Ghi chú</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.name}</strong>
                        <small>{r.email}</small>
                        <small>{r.phone}</small>
                        <small className="muted">{r.id}</small>
                      </td>
                      <td>
                        {r.date}
                        <small>
                          {r.time} · {r.guests} khách
                        </small>
                      </td>
                      <td className="notes-cell">{r.notes || '—'}</td>
                      <td>
                        <select
                          aria-label={'Trạng thái đặt bàn của ' + r.name}
                          value={r.status}
                          disabled={busy}
                          onChange={(e) => status(r.id, e.target.value)}
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!visible.length && <p className="empty">Chưa có đặt bàn phù hợp.</p>}
          </div>
        )}
        {tab === 'menu' && (
          <>
            <div className="panel-title">
              <p>{menu.length} món trong thực đơn</p>
              <button
                className="button gold small"
                onClick={() =>
                  setEditing({ ...blank, id: 'dish-' + crypto.randomUUID().slice(0, 8) })
                }
              >
                <Plus size={16} />
                Thêm món
              </button>
            </div>
            {editing && (
              <form className="form admin-editor" onSubmit={save}>
                <div className="panel-title">
                  <h2>Biên tập món ăn</h2>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setEditing(null)}
                    aria-label="Đóng biên tập"
                  >
                    <X />
                  </button>
                </div>
                <div className="form-grid">
                  <label>
                    Tên món
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  </label>
                  <label>
                    Giá (VND)
                    <input
                      type="number"
                      required
                      min={0}
                      max={100000000}
                      step={1000}
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Nhóm món
                    <select
                      value={editing.category}
                      onChange={(e) =>
                        setEditing({ ...editing, category: e.target.value as MenuItem['category'] })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Ảnh món ăn
                    <select
                      value={editing.image}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          image: e.target.value,
                          photo: seedMenu.find((item) => item.image === e.target.value)?.photo,
                        })
                      }
                    >
                      {seedMenu.map((item) => (
                        <option key={item.image} value={item.image}>
                          {item.name}
                        </option>
                      ))}
                      {['plate', 'garden', 'duck', 'dessert', 'drink'].map((c) => (
                        <option key={c} value={'/images/' + c + '.svg'}>
                          Minh họa: {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="wide">
                    Mô tả
                    <textarea
                      required
                      minLength={5}
                      maxLength={400}
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={editing.available}
                      onChange={(e) => setEditing({ ...editing, available: e.target.checked })}
                    />
                    Đang phục vụ
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={editing.vegetarian}
                      onChange={(e) => setEditing({ ...editing, vegetarian: e.target.checked })}
                    />
                    Món chay
                  </label>
                </div>
                <button className="button gold" disabled={busy}>
                  Lưu món ăn
                </button>
              </form>
            )}
            <div className="admin-panel">
              {menu.map((m) => (
                <div className="admin-menu-row" key={m.id}>
                  <img src={m.image} alt="" />
                  <div>
                    <strong>{m.name}</strong>
                    <p>
                      {m.category} · {money(m.price)} · {m.available ? 'Đang phục vụ' : 'Đã ẩn'}
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={'Sửa ' + m.name}
                    onClick={() => setEditing({ ...m })}
                  >
                    <Pencil size={17} />
                  </button>
                  {deleting === m.id ? (
                    <>
                      <button
                        className="danger-button"
                        disabled={busy}
                        onClick={() => remove(m.id)}
                      >
                        Xác nhận xóa
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Hủy xóa"
                        onClick={() => setDeleting('')}
                      >
                        <X size={17} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="icon-button"
                      aria-label={'Xóa ' + m.name}
                      onClick={() => setDeleting(m.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              ))}
              {!menu.length && <p className="empty">Thực đơn đang trống. Thêm món đầu tiên.</p>}
            </div>
          </>
        )}
        {tab === 'contacts' && (
          <div className="message-grid">
            {contacts.map((c) => (
              <article className="admin-panel message" key={c.id}>
                <span className="eyebrow">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                <h2>{c.name}</h2>
                <p className="gold-text">{c.email}</p>
                <p className="message-body">{c.message}</p>
              </article>
            ))}
            {!contacts.length && <p className="empty">Chưa có lời nhắn.</p>}
          </div>
        )}
        {tab === 'media' && (
          <div className="admin-panel media-panel">
            <ImagePlus size={36} />
            <h2>Thư viện tài sản S3</h2>
            <p>
              Tải ảnh JPG, PNG hoặc WebP, tối đa 5 MB. Bucket riêng tư; liên kết xem trước có thời
              hạn.
            </p>
            <label className="button outline">
              Chọn ảnh
              <input
                disabled={busy}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <p className="fine-print">
              Chỉ hoạt động khi đã cấu hình AWS. Artwork trên website vẫn được quản lý trong mã
              nguồn; ảnh tải lên chưa tự gắn vào gallery.
            </p>
            {media && <img className="upload-preview" src={media} alt="Ảnh vừa tải lên S3" />}
          </div>
        )}
      </div>
    </main>
  );
}
