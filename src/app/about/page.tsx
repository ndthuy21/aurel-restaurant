import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Câu chuyện' };
import Link from 'next/link';
import { PageHeading } from '@/components/page-heading';
import { ArrowUpRight } from 'lucide-react';
export default function About() {
  return (
    <main id="main">
      <div className="section page-content">
        <PageHeading
          number="03"
          title="Từ những điều nhỏ."
          accent="Đến một dư vị lâu."
          description="Aurel — một ý niệm về ẩm thực, sự kết nối và niềm vui bên bàn ăn."
        />
        <div className="about-cover">
          <img
            src="/images/spaces/garden-house.webp"
            alt="Ảnh tư liệu nhà hàng gỗ giữa cây xanh tại Ecopark"
          />
          <span>GỖ MỘC. CÂY XANH. NHỮNG BỮA ĂN GẦN GŨI.</span>
        </div>
        <p className="space-photo-note">
          Ảnh cảm hứng: nhà hàng gỗ tại Phố Trúc, Ecopark.{' '}
          <Link href="/gallery#photo-credits">Xem nguồn ảnh.</Link>
        </p>
        <div className="about-text">
          <span className="eyebrow">CÂU CHUYỆN THƯƠNG HIỆU MẪU</span>
          <h2>
            Mỗi bàn ăn đều có
            <br />
            <em>một câu chuyện.</em>
          </h2>
          <p>
            Với Aurel, sự sang trọng nằm trong cảm giác được quan tâm: một chỗ ngồi vừa ý, một gợi ý
            món ăn đúng lúc, một khoảng lặng đủ để bạn nghe câu chuyện của người đối diện.
          </p>
          <p>
            Thực đơn mẫu tìm cảm hứng từ những vùng nguyên liệu Việt Nam và cách chế biến đương đại.
            Vị ngọt của rau củ, hương thảo mộc và những lớp kết cấu được cân bằng để mỗi món ăn giữ
            được cá tính riêng.
          </p>
          <p>
            Chúng tôi hình dung Aurel như một nơi để trở lại: cho lần hẹn đầu, buổi gặp bạn cũ, hay
            đơn giản là một buổi tối bạn muốn dành cho chính mình.
          </p>
          <div className="quote">
            “Điều đọng lại sau một bữa ăn
            <br />
            là cách chúng ta đã ở bên nhau.”<span>TINH THẦN AUREL · NỘI DUNG SÁNG TÁC</span>
          </div>
        </div>
        <div className="about-values">
          {[
            [
              '01',
              'Nguyên liệu là khởi đầu',
              'Chọn điều phù hợp với mùa, trân trọng hương vị vốn có.',
            ],
            [
              '02',
              'Tinh tế trong sự vừa đủ',
              'Kỹ thuật phục vụ cho hương vị, để món ăn tự cất lời.',
            ],
            ['03', 'Hiếu khách từ tâm', 'Một không gian ấm áp, một nhịp phục vụ đầy quan tâm.'],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span className="eyebrow">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </div>
      <section className="cta section">
        <span className="eyebrow">HÃY ĐỂ CÂU CHUYỆN TIẾP TỤC</span>
        <h2>
          Gặp nhau <em>bên bàn ăn.</em>
        </h2>
        <Link href="/reservation" className="button gold">
          Đặt bàn <ArrowUpRight size={16} />
        </Link>
      </section>
    </main>
  );
}
