import { z } from 'zod';
import { categories, seedMenu, times, todayVN } from './data';
const clean = z.string().trim();
export const reservationSchema = z
  .object({
    id: z.string().uuid(),
    name: clean.min(2).max(100),
    email: clean.email().max(200),
    phone: clean.regex(/^[+0-9 ()-]{8,20}$/),
    date: clean.regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
      const d = new Date(v + 'T00:00:00Z');
      return (
        !isNaN(d.valueOf()) &&
        d.toISOString().slice(0, 10) === v &&
        v >= todayVN() &&
        d.valueOf() <= Date.now() + 90 * 86400000
      );
    }, 'Chọn ngày hợp lệ trong 90 ngày tới'),
    time: z.enum(times as [string, ...string[]]),
    guests: z.number().int().min(1).max(8),
    notes: clean.max(500).default(''),
    website: clean.max(0).default(''),
    consent: z.literal(true),
  })
  .refine(
    (v) => new Date(v.date + 'T' + v.time + ':00+07:00').valueOf() > Date.now() + 30 * 60000,
    'Vui lòng đặt trước ít nhất 30 phút',
  );
export const contactSchema = z.object({
  name: clean.min(2).max(100),
  email: clean.email().max(200),
  message: clean.min(10).max(2000),
  website: clean.max(0).default(''),
  consent: z.literal(true),
});
export const menuSchema = z.object({
  id: clean.regex(/^[a-z0-9-]{1,60}$/),
  name: clean.min(2).max(100),
  description: clean.min(5).max(400),
  price: z.number().int().min(0).max(100000000),
  category: z.enum(categories),
  vegetarian: z.boolean(),
  available: z.boolean(),
  image: clean.refine(
    (path) =>
      [
        '/images/plate.svg',
        '/images/garden.svg',
        '/images/duck.svg',
        '/images/dessert.svg',
        '/images/drink.svg',
        ...seedMenu.map((item) => item.image),
      ].includes(path),
    'Chọn ảnh món ăn có trong thư viện',
  ),
  photo: z
    .object({
      title: clean.min(1).max(500),
      author: clean.min(1).max(2000),
      source: z.url().startsWith('https://commons.wikimedia.org/'),
      license: clean.min(1).max(100),
      licenseUrl: z
        .url()
        .refine((url) => /^https:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//.test(url)),
    })
    .optional(),
});
export const statusSchema = z.object({ status: z.enum(['pending', 'confirmed', 'cancelled']) });
export type Reservation = z.infer<typeof reservationSchema> & {
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
};
export type Contact = z.infer<typeof contactSchema> & { id: string; createdAt: string };
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const mediaSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().min(1).max(5_000_000),
});
