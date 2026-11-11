'use client';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { MenuItem } from '@/lib/data';

export function FoodPhoto({ item, eager = false }: { item: MenuItem; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="food-photo-error" role="img" aria-label={`Chưa tải được ảnh ${item.name}`}>
      <ImageOff size={28} aria-hidden="true" />
      <span>Ảnh đang tạm gián đoạn</span>
    </div>
  ) : (
    <img
      src={item.image}
      alt={`Ảnh món ${item.name}`}
      width={800}
      height={600}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function PhotoCredit({ item }: { item: Pick<MenuItem, 'photo'> }) {
  if (!item.photo) return null;
  return (
    <details className="photo-credit">
      <summary>Nguồn ảnh</summary>
      <p>
        <a href={item.photo.source} target="_blank" rel="noreferrer">
          {item.photo.title}
        </a>
        {' · '}
        {item.photo.author}
        {' · '}
        <a href={item.photo.licenseUrl} target="_blank" rel="noreferrer">
          {item.photo.license}
        </a>
        . Bản ảnh được thu nhỏ và chuyển WebP; khung hiển thị cắt theo bố cục.
      </p>
    </details>
  );
}
