import type { MenuItem } from './data';

export const MENU_PAGE_SIZE = 12;
export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();

export function filterMenu(
  items: MenuItem[],
  category: string,
  vegetarian: boolean,
  query: string,
) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const text = normalizeSearch(`${item.name} ${item.description} ${item.category}`);
    return (
      item.available &&
      (category === 'Tất cả' || item.category === category) &&
      (!vegetarian || item.vegetarian) &&
      terms.every((term) => text.includes(term))
    );
  });
}

export function menuPage(items: MenuItem[], page: number) {
  const pages = Math.max(1, Math.ceil(items.length / MENU_PAGE_SIZE));
  const current = Math.max(1, Math.min(Math.floor(page) || 1, pages));
  return {
    pages,
    current,
    start: items.length ? (current - 1) * MENU_PAGE_SIZE + 1 : 0,
    end: Math.min(current * MENU_PAGE_SIZE, items.length),
    items: items.slice((current - 1) * MENU_PAGE_SIZE, current * MENU_PAGE_SIZE),
  };
}
