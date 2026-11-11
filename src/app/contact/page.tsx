import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Liên hệ' };
import { PageHeading } from '@/components/page-heading';
import { ContactForm } from '@/components/forms';
import { MapPin, Clock, Mail, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
export default function Contact() {
  return (
    <main id="main" className="section page-content">
      <PageHeading
        number="04"
        title="Bắt đầu bằng"
        accent="một lời chào."
        description="Một câu hỏi, một ý tưởng cho buổi tiệc hay đơn giản là lời chào từ bạn."
      />
      <div className="contact-grid">
        <div>
          <div className="contact-detail">
            <MapPin />
            <div>
              <span className="eyebrow">ĐỊA CHỈ MINH HỌA</span>
              <h3>24 Đường Ánh Trăng</h3>
              <p>
                Quận 1, TP. Hồ Chí Minh
                <br />
                Địa chỉ hư cấu, không có địa điểm thực tế.
              </p>
            </div>
          </div>
          <div className="contact-detail">
            <Clock />
            <div>
              <span className="eyebrow">GIỜ ĐÓN KHÁCH</span>
              <h3>Mỗi ngày · 17:30 – 22:30</h3>
              <p>Nhận yêu cầu đặt bàn trước ít nhất 30 phút.</p>
            </div>
          </div>
          <div className="contact-detail">
            <Mail />
            <div>
              <span className="eyebrow">EMAIL MẪU</span>
              <h3>hello@aurel.example</h3>
              <p>Hộp thư minh họa. Hãy dùng form để lưu lời nhắn vào ứng dụng.</p>
            </div>
          </div>
          <div className="contact-map">
            <div className="map-lines" />
            <MapPin />
            <strong>AUREL</strong>
            <span>Sơ đồ minh họa · Sài Gòn</span>
          </div>
          <Link className="text-link" href="/reservation">
            Bạn muốn đặt bàn? <ArrowUpRight size={16} />
          </Link>
        </div>
        <ContactForm />
      </div>
    </main>
  );
}
