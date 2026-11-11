import catalog from './menu-catalog.json';
export const categories = [
  'Khai vị',
  'Món cuốn & Bánh',
  'Bún, Phở & Mì',
  'Cơm & Xôi',
  'Món chính',
  'Hải sản',
  'Món chay',
  'Tráng miệng',
  'Thức uống',
] as const;
export type Category = (typeof categories)[number];
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  vegetarian: boolean;
  available: boolean;
  image: string;
  photo?: { title: string; author: string; source: string; license: string; licenseUrl: string };
};
export const seedMenu: MenuItem[] = catalog as MenuItem[];
export const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
export const times = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
export const todayVN = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const restaurant = {
  address: '24 Đường Ánh Trăng, Quận 1, TP. Hồ Chí Minh',
  email: 'hello@aurel.example',
  phone: 'Thông tin liên hệ minh họa',
  hours: 'Thứ Hai – Chủ Nhật · 17:30 – 22:30',
};
