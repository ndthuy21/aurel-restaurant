import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { seedMenu } from '../src/lib/data';
import { menuSchema } from '../src/lib/schema';
import { filterMenu, menuPage } from '../src/lib/menu';

describe('Vietnamese menu catalog', () => {
  it('contains exactly 100 distinct dishes with distinct real, decodable photo files and credits', () => {
    expect(seedMenu).toHaveLength(100);
    expect(new Set(seedMenu.map((item) => item.id)).size).toBe(100);
    expect(new Set(seedMenu.map((item) => item.name)).size).toBe(100);
    expect(new Set(seedMenu.map((item) => item.image)).size).toBe(100);
    expect(new Set(seedMenu.map((item) => item.photo?.source)).size).toBe(100);
    for (const item of seedMenu) {
      expect(menuSchema.safeParse(item).success, item.name).toBe(true);
      expect(item.photo?.source).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
      expect(item.photo?.author).toBeTruthy();
      const bytes = readFileSync('public' + item.image);
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
      expect(bytes.length).toBeGreaterThan(1000);
    }
  });
  it('finds Vietnamese food without accents and combines text, category and diet filters', () => {
    expect(
      filterMenu(seedMenu, 'Tất cả', false, 'bun bo hue').some((x) => x.name === 'Bún bò Huế'),
    ).toBe(true);
    expect(filterMenu(seedMenu, 'Tất cả', false, 'ĐẬU')).toEqual(
      filterMenu(seedMenu, 'Tất cả', false, 'dau'),
    );
    const results = filterMenu(seedMenu, 'Tráng miệng', true, 'che');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((x) => x.vegetarian && x.category === 'Tráng miệng')).toBe(true);
    expect(filterMenu(seedMenu, 'Tất cả', false, 'no-such-dish-2386')).toEqual([]);
  });
  it('paginates every dish once, clamps stale pages after filtering and handles empty results', () => {
    const collected = Array.from({ length: 9 }, (_, i) => menuPage(seedMenu, i + 1).items).flat();
    expect(collected.map((x) => x.id)).toEqual(seedMenu.map((x) => x.id));
    expect(menuPage(seedMenu, 9).items).toHaveLength(4);
    expect(menuPage(seedMenu.slice(0, 2), 9)).toMatchObject({
      current: 1,
      pages: 1,
      start: 1,
      end: 2,
    });
    expect(menuPage([], 5)).toMatchObject({ current: 1, start: 0, end: 0, items: [] });
  });
  it('rejects external or unregistered image URLs when editing the menu', () => {
    for (const image of [
      'https://example.com/food.jpg',
      'javascript:alert(1)',
      '/images/menu/unknown.webp',
    ]) {
      expect(menuSchema.safeParse({ ...seedMenu[0], image }).success).toBe(false);
    }
  });
});
