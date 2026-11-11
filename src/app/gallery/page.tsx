'use client';
import { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Expand, ImageOff } from 'lucide-react';
import { PageHeading } from '@/components/page-heading';
import { PhotoCredit } from '@/components/food-photo';
import { galleryImages, type GalleryImage } from '@/lib/gallery';

function Photograph({
  image,
  large = false,
  eager = false,
}: {
  image: GalleryImage;
  large?: boolean;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="gallery-photo-error" role="img" aria-label={`Chưa tải được ảnh ${image.title}`}>
      <ImageOff size={26} aria-hidden="true" />
      <span>Ảnh đang tạm gián đoạn</span>
    </div>
  ) : (
    <img
      src={large ? image.src : image.thumb}
      srcSet={
        !large && image.src !== image.thumb
          ? `${image.thumb} 640w, ${image.src} ${image.width}w`
          : undefined
      }
      sizes={!large ? '(max-width: 500px) 88vw, (max-width: 800px) 44vw, 60vw' : undefined}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={large || eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
export default function Gallery() {
  const [filter, setFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const shown = galleryImages.filter((x) => filter === 'Tất cả' || x.type === filter);
  useEffect(() => {
    if (selected !== null && !dialog.current?.open) dialog.current?.showModal();
    if (selected === null) {
      if (dialog.current?.open) dialog.current.close();
      trigger.current?.focus();
    }
  }, [selected]);
  function move(n: number) {
    setSelected((i) => (i === null ? null : (i + n + shown.length) % shown.length));
  }
  const current = selected === null ? null : shown[selected];
  return (
    <main id="main" className="section page-content">
      <PageHeading
        number="02"
        title="Chất Việt trong từng góc."
        accent="Ấm một cuộc hẹn."
        description="Mây tre, gỗ mộc, ánh đèn dịu và những món ăn thân quen — bộ ảnh cảm hứng dành cho tinh thần Aurel."
      />
      <div className="tabs gallery-tabs" aria-label="Nhóm ảnh">
        {['Tất cả', 'Không gian', 'Ẩm thực', 'Chi tiết'].map((t) => (
          <button
            aria-pressed={filter === t}
            className={filter === t ? 'active' : ''}
            key={t}
            onClick={() => {
              setSelected(null);
              setFilter(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="gallery-intro">
        Ảnh tư liệu từ nhiều địa điểm, được chọn để gợi cảm hứng cho không gian và thực đơn Việt.{' '}
        <a href="#photo-credits">Xem tác giả và địa điểm gốc.</a>
      </p>
      <div className="gallery-grid">
        {shown.map((image, i) => (
          <button
            key={image.id}
            className="gallery-tile"
            aria-label={`Phóng to: ${image.title}`}
            aria-haspopup="dialog"
            onClick={(e) => {
              trigger.current = e.currentTarget;
              setSelected(i);
            }}
          >
            <Photograph image={image} eager={i < 2} />
            <span>
              <small>{image.type}</small>
              <strong>{image.title}</strong>
            </span>
            <Expand className="expand" size={20} aria-hidden="true" />
          </button>
        ))}
      </div>
      <section
        id="photo-credits"
        className="gallery-credits"
        aria-labelledby="photo-credits-heading"
      >
        <span className="eyebrow">NHỮNG NGƯỜI KỂ CHUYỆN BẰNG ẢNH</span>
        <h2 id="photo-credits-heading">Nguồn ảnh & cảm hứng.</h2>
        <p>
          Các tác giả và địa điểm gốc được ghi tại từng ảnh. Chọn “Nguồn ảnh” để xem giấy phép và
          bản gốc.
        </p>
        <div>
          {galleryImages.map((image) => (
            <article key={image.id}>
              <h3>{image.title}</h3>
              <PhotoCredit item={image} />
            </article>
          ))}
        </div>
      </section>
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label="Xem ảnh không gian và ẩm thực"
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            move(-1);
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            move(1);
          }
        }}
      >
        <button
          className="icon-button lightbox-close"
          onClick={() => setSelected(null)}
          aria-label="Đóng ảnh"
        >
          <X />
        </button>
        {current && (
          <>
            <Photograph key={current.id} image={current} large />
            <div className="lightbox-controls">
              <button className="icon-button" aria-label="Ảnh trước" onClick={() => move(-1)}>
                <ArrowLeft />
              </button>
              <p aria-live="polite">
                {current.title} · {selected! + 1}/{shown.length}
              </p>
              <button className="icon-button" aria-label="Ảnh sau" onClick={() => move(1)}>
                <ArrowRight />
              </button>
            </div>
            <PhotoCredit item={current} />
          </>
        )}
      </dialog>
    </main>
  );
}
