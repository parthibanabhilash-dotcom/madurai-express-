// Explicitly selected illustrative stock photos, never automatic production fallbacks.
export const menuPhotos = {
  'illustrative-biryani': '/demo-biryani.jpg',
  'illustrative-dosa': '/demo-dosa.jpg',
  'illustrative-meal': '/demo-meal.jpg',
} as const;
export function illustrativePhoto(id: string | null) {
  return id && Object.hasOwn(menuPhotos, id) ? menuPhotos[id as keyof typeof menuPhotos] : null;
}
export function categoryPhotoId(category: string) {
  return category === 'Dosai'
    ? 'illustrative-dosa'
    : ['Biryani', 'Bucket Biryani'].includes(category)
      ? 'illustrative-biryani'
      : 'illustrative-meal';
}
