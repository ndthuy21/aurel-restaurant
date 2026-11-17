export const MENU_IMAGE_MAX_BYTES = 2_000_000;
export const MENU_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MENU_IMAGE_MAX_BASE64 = Math.ceil(MENU_IMAGE_MAX_BYTES / 3) * 4;
export const MENU_IMAGE_MAX_REQUEST = MENU_IMAGE_MAX_BASE64 + 16_384;

const imageRoute =
  /^\/menu-image\/([a-z0-9-]{1,60})\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/;

export function parseMenuImage(route: string) {
  const match = imageRoute.exec(route);
  if (!match) return null;
  const [, dishId, version] = match;
  return { dishId, version, key: `menu-images/${dishId}/${version}` };
}
