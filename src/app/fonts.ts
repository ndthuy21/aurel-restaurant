import localFont from 'next/font/local';

// Bundled fonts include Vietnamese letters and combining accents on every platform.
export const sans = localFont({
  src: [
    { path: '../assets/fonts/NotoSans-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/NotoSans-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/NotoSans-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/NotoSans-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
  fallback: ['Segoe UI', 'Arial', 'Helvetica', 'sans-serif'],
});

export const serif = localFont({
  src: [
    { path: '../assets/fonts/NotoSerif-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/NotoSerif-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-heading',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
});
