import spaces from './space-photos.json';
import { seedMenu, type MenuItem } from './data';
export type GalleryImage = {
  id: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  title: string;
  type: string;
  alt: string;
  photo: NonNullable<MenuItem['photo']>;
};
const spacePhotos: GalleryImage[] = spaces;
const food = (id: string): GalleryImage => {
  const item = seedMenu.find((entry) => entry.id === id)!;
  return {
    id: item.id,
    src: item.image,
    thumb: item.image,
    width: 800,
    height: 600,
    title: item.name,
    type: 'Ẩm thực',
    alt: `Ảnh món ${item.name}`,
    photo: item.photo!,
  };
};
export const galleryImages: GalleryImage[] = [
  spacePhotos[0],
  food('dish-001'),
  spacePhotos[7],
  spacePhotos[1],
  spacePhotos[3],
  food('dish-033'),
  spacePhotos[2],
  spacePhotos[5],
  food('dish-014'),
  spacePhotos[6],
  spacePhotos[4],
  food('dish-087'),
];
