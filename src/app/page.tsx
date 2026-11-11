import Link from 'next/link';
import { ArrowUpRight, ArrowDown, Wine, Sprout, UtensilsCrossed, Sparkle } from 'lucide-react';
import { seedMenu, money } from '@/lib/data';
import { FoodPhoto, PhotoCredit } from '@/components/food-photo';
export default function Home() {
  return (
    <main id="main">
      <section className="hero">
        <div
          className="hero-art"
          role="img"
          aria-label="Ảnh tư liệu phòng ăn với bàn ghế gỗ, trần gỗ và khoảng sáng mở"
        />
        <div className="hero-shade" />
        <div className="hero-copy">
          <div className="eyebrow">
            <i />
            ẨM THỰC ĐƯƠNG ĐẠI · SÀI GÒN
          </div>
          <h1>
            Nơi hương vị
            <br />
            chạm đến <em>cảm xúc.</em>
          </h1>
          <p>
            Một chút thân quen. Một nét bất ngờ.
            <br />
            Và một buổi tối chỉ dành cho bạn.
          </p>
          <div className="hero-actions">
            <Link className="button gold" href="/reservation">
              Đặt bàn tại Aurel <ArrowUpRight size={17} />
            </Link>
            <Link className="text-link" href="/menu">
              Khám phá thực đơn <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="hero-bottom">
          <span>ĐƯỢC NẤU BẰNG TÂM HUYẾT. ĐƯỢC NHỚ BẰNG CẢM XÚC.</span>
          <a href="#story" aria-label="Khám phá câu chuyện" className="scroll-link">
            <ArrowDown size={18} />
          </a>
          <span>
            01 <b>/</b> AUREL EXPERIENCE
          </span>
        </div>
        <Link className="art-note" href="/gallery#photo-credits">
          ẢNH TƯ LIỆU · NGUỒN ẢNH
        </Link>
      </section>
      <div className="ribbon">
        <span>SEASONAL INGREDIENTS</span>
        <Sparkle size={14} aria-hidden="true" />
        <span>THOUGHTFUL DINING</span>
        <Sparkle size={14} aria-hidden="true" />
        <span>TIME WELL SPENT</span>
        <Sparkle size={14} aria-hidden="true" />
        <span>AUREL, WITH LOVE</span>
      </div>
      <section id="story" className="section story-grid">
        <div className="story-image">
          <img
            src="/images/spaces/sunlit-table.webp"
            alt="Bàn gỗ, bộ ấm chén và bình hoa trong nắng"
            loading="lazy"
          />
          <span className="image-stamp">
            THE ART OF
            <br />
            <em>slowing down.</em>
          </span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">01 / CÂU CHUYỆN AUREL</span>
          <h2>
            Giữ lại khoảnh khắc.
            <br />
            <em>Đánh thức vị giác.</em>
          </h2>
          <p>
            Aurel bắt đầu từ một ý tưởng giản dị: bữa ăn ngon là khởi đầu của một cuộc trò chuyện
            đẹp. Chúng tôi để nguyên liệu theo mùa kể câu chuyện của mình, trong một không gian đủ
            ấm để bạn thấy thật gần gũi.
          </p>
          <p>
            Tinh thần ẩm thực Việt, kỹ thuật đương đại và sự chăm chút trong từng chi tiết — tất cả
            gặp nhau bên bàn ăn.
          </p>
          <Link className="text-link" href="/about">
            Câu chuyện của chúng tôi <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="section signature">
        <div className="section-head">
          <div>
            <span className="eyebrow">02 / HƯƠNG VỊ ĐẶC TRƯNG</span>
            <h2>
              Một hành trình.
              <br />
              <em>Nhiều dư vị.</em>
            </h2>
          </div>
          <div>
            <p>
              Nguyên liệu quen thuộc, một cách kể mới.
              <br />
              Một trăm món Việt, nhiều miền hương vị.
            </p>
            <Link className="text-link" href="/menu">
              Xem toàn bộ thực đơn <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="dish-grid">
          {['dish-001', 'dish-033', 'dish-087']
            .map((id) => seedMenu.find((item) => item.id === id)!)
            .filter(Boolean)
            .map((item, i) => (
              <article className="dish-card" key={item.id}>
                <Link href="/menu" aria-label={'Xem thực đơn: ' + item.name}>
                  <div className="dish-image">
                    <FoodPhoto item={item} />
                    <span>0{i + 1}</span>
                    <b>
                      <ArrowUpRight size={18} />
                    </b>
                  </div>
                </Link>
                <div className="dish-meta">
                  <span>{item.category}</span>
                  <span>{money(item.price)}</span>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <PhotoCredit item={item} />
              </article>
            ))}
        </div>
        <p className="fine-print">
          Gợi ý minh họa. Thực đơn và tình trạng phục vụ hiện tại có tại trang Thực đơn.
        </p>
      </section>
      <section className="experience">
        <img
          src="/images/spaces/bamboo-lights.webp"
          alt="Ảnh tư liệu không gian nhà hàng Việt với đèn mây tre và bàn gỗ"
          loading="lazy"
        />
        <div>
          <span className="eyebrow">03 / KHÔNG GIAN GẶP GỠ</span>
          <h2>
            Chậm lại một chút.
            <br />
            <em>Tận hưởng nhiều hơn.</em>
          </h2>
          <Link className="button outline" href="/gallery">
            Bước vào Aurel <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="section values">
        <div>
          <Sprout />
          <h3>Thuận theo mùa</h3>
          <p>Thực đơn thay đổi theo cảm hứng từ những nguyên liệu tươi ngon.</p>
        </div>
        <div>
          <UtensilsCrossed />
          <h3>Chăm chút từng vị</h3>
          <p>Một điểm nhấn vừa đủ, để hương vị nguyên bản được tỏa sáng.</p>
        </div>
        <div>
          <Wine />
          <h3>Trọn vẹn cuộc hẹn</h3>
          <p>Từ bữa tối thân mật đến một dịp đặc biệt, luôn có chỗ cho bạn.</p>
        </div>
      </section>
      <section className="cta section">
        <span className="eyebrow">MỘT BUỔI TỐI ĐANG CHỜ</span>
        <h2>
          Hẹn bạn <em>tại Aurel.</em>
        </h2>
        <p>Để chúng tôi chuẩn bị một chỗ ngồi thật đẹp.</p>
        <Link className="button gold" href="/reservation">
          Đặt bàn của bạn <ArrowUpRight size={17} />
        </Link>
      </section>
    </main>
  );
}
