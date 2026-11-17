import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MENU_IMAGE_MAX_BYTES, parseMenuImage } from '../lib/menu-image';
import type { MenuItem } from '../lib/data';
import { ApiError, type menuSaveSchema } from '../lib/schema';
import type { z } from 'zod';
import type { Store } from './store';

type Upload = NonNullable<z.infer<typeof menuSaveSchema>['imageUpload']>;

export function rasterType(bytes: Uint8Array) {
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    data.length >= 20 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff &&
    data.at(-2) === 0xff &&
    data.at(-1) === 0xd9
  )
    return 'image/jpeg';
  if (
    data.length >= 33 &&
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    data.toString('ascii', 12, 16) === 'IHDR'
  )
    return 'image/png';
  if (
    data.length >= 20 &&
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.readUInt32LE(4) + 8 === data.length &&
    data.toString('ascii', 8, 12) === 'WEBP' &&
    ['VP8 ', 'VP8L', 'VP8X'].includes(data.toString('ascii', 12, 16))
  )
    return 'image/webp';
  return null;
}

const s3 = () => new S3Client({});

export function localMenuPhotoPath(key: string) {
  return resolve(dirname(resolve(process.env.LOCAL_DATA_PATH || '.data/aurel.json')), key);
}

export async function saveMenuPhoto(dishId: string, upload: Upload) {
  const bytes = Buffer.from(upload.data, 'base64');
  if (bytes.length > MENU_IMAGE_MAX_BYTES) throw new ApiError(413, 'Ảnh tối đa 2 MB.');
  if (bytes.toString('base64') !== upload.data || rasterType(bytes) !== upload.contentType)
    throw new ApiError(400, 'Tệp không phải ảnh JPG, PNG hoặc WebP hợp lệ.');

  const route = `/menu-image/${dishId}/${randomUUID()}`;
  const { key } = parseMenuImage(route)!;
  if (process.env.DATA_MODE === 'aws') {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.MEDIA_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: upload.contentType,
        CacheControl: 'private, no-store',
      }),
    );
  } else {
    const file = localMenuPhotoPath(key);
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    await writeFile(file + '.tmp', bytes, { mode: 0o600, flag: 'wx' });
    await rename(file + '.tmp', file);
  }
  return '/api' + route;
}

export async function visibleMenuPhoto(route: string, admin: boolean, store: Store) {
  const photo = parseMenuImage(route);
  if (!photo) throw new ApiError(404, 'Không tìm thấy ảnh món ăn.');
  const dish = await store.get<MenuItem>('menu', photo.dishId);
  if (!dish || (!dish.available && !admin) || dish.image !== '/api' + route)
    throw new ApiError(404, 'Không tìm thấy ảnh món ăn.');
  return photo;
}

export async function signedMenuPhoto(key: string) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: process.env.MEDIA_BUCKET,
      Key: key,
      ResponseCacheControl: 'private, no-store',
    }),
    { expiresIn: 120 },
  );
}
