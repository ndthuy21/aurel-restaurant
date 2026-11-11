import { BookingForm } from '@/components/forms';
import { PageHeading } from '@/components/page-heading';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Đặt bàn' };
export default function Reservation() {
  return (
    <main id="main" className="section page-content">
      <PageHeading
        number="05"
        title="Một cuộc hẹn."
        accent="Thật đáng nhớ."
        description="Chọn thời gian của bạn, phần còn lại hãy để Aurel chăm chút."
      />
      <div className="booking-grid">
        <aside className="booking-aside">
          <img src="/images/detail.svg" alt="Artwork bàn ăn ấm áp tại Aurel" />
          <div>
            <span className="eyebrow">RẤT VUI ĐƯỢC ĐÓN BẠN</span>
            <h3>
              Mọi dịp đều xứng đáng
              <br />
              với một bữa tối đẹp.
            </h3>
            <p>
              Đón khách mỗi ngày
              <br />
              17:30 – 22:30
            </p>
            <hr />
            <p>Nhóm trên 8 người hoặc sự kiện riêng: vui lòng gửi lời nhắn qua trang Liên hệ.</p>
            <p className="fine-print">
              Đây là website nhà hàng minh họa. Không có dịch vụ đặt bàn ngoài đời thực.
            </p>
          </div>
        </aside>
        <BookingForm />
      </div>
    </main>
  );
}
