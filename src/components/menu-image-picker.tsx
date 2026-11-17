'use client';

import { useEffect, useId, useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { seedMenu, type MenuItem } from '@/lib/data';
import { normalizeSearch } from '@/lib/menu';
import { MENU_IMAGE_MAX_BYTES, MENU_IMAGE_TYPES } from '@/lib/menu-image';

type ImageChoice = Pick<MenuItem, 'image' | 'photo'> & { name: string };

const choices: ImageChoice[] = [
  ...seedMenu,
  ...[
    ['plate', 'Đĩa ăn'],
    ['garden', 'Khu vườn'],
    ['duck', 'Món vịt'],
    ['dessert', 'Món tráng miệng'],
    ['drink', 'Đồ uống'],
  ].map(([file, name]) => ({ image: '/images/' + file + '.svg', name: 'Minh họa: ' + name })),
];

export function MenuImagePicker({
  value,
  onChange,
  file,
  onFileChange,
  disabled,
}: {
  value: string;
  onChange: (choice: ImageChoice) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [fileError, setFileError] = useState('');
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const filtered = choices.filter((choice) =>
    terms.every((term) => normalizeSearch(choice.name).includes(term)),
  );
  const selected = choices.find((choice) => choice.image === value);

  return (
    <fieldset className="menu-image-picker wide" disabled={disabled}>
      <legend>Ảnh món ăn</legend>
      <div className="menu-image-current">
        <img
          src={file && preview?.file === file ? preview.url : value}
          alt=""
          width={112}
          height={84}
        />
        <div>
          <span className="muted">Ảnh đang chọn</span>
          <strong aria-live="polite">{file?.name ?? selected?.name ?? 'Ảnh đã tải lên'}</strong>
        </div>
      </div>
      <div className="menu-image-upload">
        <label className="button outline small menu-image-file-label">
          <Upload size={16} aria-hidden="true" />
          Tải ảnh lên
          <input
            className="sr-only"
            type="file"
            accept={MENU_IMAGE_TYPES.join(',')}
            aria-describedby={id + '-hint'}
            onChange={(event) => {
              const chosen = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (!chosen) return;
              if (!MENU_IMAGE_TYPES.some((type) => type === chosen.type)) {
                setFileError('Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
                return;
              }
              if (chosen.size === 0 || chosen.size > MENU_IMAGE_MAX_BYTES) {
                setFileError('Chọn một ảnh có dung lượng tối đa 2 MB.');
                return;
              }
              setFileError('');
              onFileChange(chosen);
            }}
          />
        </label>
        {file && (
          <button
            type="button"
            className="button outline small"
            onClick={() => {
              setFileError('');
              onFileChange(null);
            }}
          >
            Bỏ ảnh mới
          </button>
        )}
        <span className="muted" id={id + '-hint'}>
          JPG, PNG hoặc WebP · tối đa 2 MB
        </span>
      </div>
      {fileError && (
        <p className="error" role="alert">
          {fileError}
        </p>
      )}
      <details>
        <summary>
          <ImageIcon size={16} aria-hidden="true" />
          Chọn ảnh từ thư viện
        </summary>
        <label htmlFor={id + '-search'}>
          Tìm ảnh
          <input
            id={id + '-search'}
            type="search"
            placeholder="Ví dụ: phở, bánh xèo…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
          />
        </label>
        <p className="muted" role="status">
          {filtered.length ? filtered.length + ' ảnh' : 'Không tìm thấy ảnh phù hợp.'}
        </p>
        <div className="menu-image-options" role="radiogroup" aria-label="Ảnh trong thư viện">
          {filtered.map((choice) => (
            <label className="menu-image-option" key={choice.image}>
              <input
                className="sr-only"
                type="radio"
                name={id}
                checked={!file && choice.image === value}
                onChange={() => {
                  setFileError('');
                  onFileChange(null);
                  onChange(choice);
                }}
              />
              <img
                src={choice.image}
                alt=""
                width={160}
                height={120}
                loading="lazy"
                decoding="async"
              />
              <span>{choice.name}</span>
            </label>
          ))}
        </div>
      </details>
    </fieldset>
  );
}
