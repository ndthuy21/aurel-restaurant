'use client';
import { useRef, useState } from 'react';
import { ArrowUpRight, Check, RotateCcw } from 'lucide-react';
import { api } from '@/lib/client';
import { times, todayVN } from '@/lib/data';
export function BookingForm() {
  const id = useRef('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    if (!id.current) id.current = crypto.randomUUID();
    try {
      const r = await api<{ id: string }>('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          id: id.current,
          name: f.get('name'),
          email: f.get('email'),
          phone: f.get('phone'),
          date: f.get('date'),
          time: f.get('time'),
          guests: Number(f.get('guests')),
          notes: f.get('notes'),
          website: f.get('website'),
          consent: f.get('consent') === 'on',
        }),
      });
      setSuccess(r.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="success-panel" role="status">
        <span className="success-icon">
          <Check />
        </span>
        <span className="eyebrow">ĐÃ NHẬN YÊU CẦU</span>
        <h2>
          Hẹn một buổi tối <em>thật đẹp.</em>
        </h2>
        <p>
          Yêu cầu của bạn đã được lưu. Đây chưa phải xác nhận bàn; nhà hàng sẽ liên hệ để xác nhận.
        </p>
        <code>Mã đặt bàn: {success}</code>
        <button
          className="button outline"
          onClick={() => {
            setSuccess('');
            id.current = '';
          }}
        >
          Đặt thêm bàn <RotateCcw size={15} />
        </button>
      </div>
    );
  return (
    <form
      onSubmit={submit}
      onChange={() => {
        id.current = '';
      }}
      className="form"
    >
      <div className="form-intro">
        <span className="eyebrow">THÔNG TIN CUỘC HẸN</span>
        <h2>
          Dành một chỗ <em>cho bạn.</em>
        </h2>
      </div>
      <div className="form-grid">
        <label>
          Họ và tên
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="Tên của bạn"
          />
        </label>
        <label>
          Số điện thoại
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            minLength={8}
            maxLength={20}
            placeholder="Số điện thoại liên hệ"
          />
        </label>
        <label className="wide">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Ngày dùng bữa
          <input
            name="date"
            type="date"
            required
            min={todayVN()}
            max={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}
          />
        </label>
        <label>
          Giờ đến
          <select name="time" defaultValue="19:00">
            {times.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="wide">
          Số khách
          <select name="guests" defaultValue="2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} khách
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          Lời nhắn <span className="muted">(không bắt buộc)</span>
          <textarea
            name="notes"
            maxLength={500}
            rows={3}
            placeholder="Dịp đặc biệt, dị ứng thực phẩm hoặc yêu cầu khác…"
          />
        </label>
      </div>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="checkbox consent">
        <input type="checkbox" required name="consent" />
        Tôi đồng ý cung cấp thông tin để xử lý và liên hệ về yêu cầu đặt bàn này.
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button gold full" disabled={busy}>
        {busy ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu đặt bàn'}
        <ArrowUpRight size={17} />
      </button>
      <p className="fine-print">
        Tối đa 8 khách mỗi yêu cầu, trong 90 ngày tới. Vui lòng đặt trước ít nhất 30 phút.
      </p>
    </form>
  );
}
export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      await api('/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: f.get('name'),
          email: f.get('email'),
          message: f.get('message'),
          website: f.get('website'),
          consent: f.get('consent') === 'on',
        }),
      });
      setMessage('Đã lưu lời nhắn của bạn. Cảm ơn bạn đã kết nối với Aurel.');
      form.reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h2>
        Gửi một <em>lời nhắn.</em>
      </h2>
      <label>
        Họ và tên
        <input name="name" autoComplete="name" required minLength={2} maxLength={100} />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required maxLength={200} />
      </label>
      <label>
        Lời nhắn
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} />
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="checkbox consent">
        <input type="checkbox" name="consent" required />
        Tôi đồng ý cung cấp thông tin để nhận phản hồi về lời nhắn này.
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <button disabled={busy} className="button gold">
        {busy ? 'Đang gửi…' : 'Gửi lời nhắn'}
        <ArrowUpRight size={16} />
      </button>
    </form>
  );
}
