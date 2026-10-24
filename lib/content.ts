export const categories = [
  'Biryani',
  'Bucket Biryani',
  'Parotta and Combos',
  'Dosai',
  'Gravies and Sides',
  'South Indian',
];
export const defaultSettings = {
  id: 'business',
  phone: '+919342328311',
  address:
    'SM Complex, 220/2A, Airport Mattuthavani Ring Rd, Santhosh Nagar, Avaniyapuram, Madurai, Tamil Nadu 625012',
  addressConfirmed: false,
  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=Madurai+Express+SM+Complex+Avaniyapuram+Madurai',
  mapConfirmed: false,
  orderUrl: '',
  hours: null,
  whatsappEnabled: false,
  whatsappNumber: '',
};
export const stock = {
  hero: '/demo-biryani.jpg',
  dosa: '/demo-dosa.jpg',
  meal: '/demo-meal.jpg',
};
export function demoEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.DEMO_PREVIEW === 'true';
}
export function activeOffer(
  offer: { published: boolean; startsAt: Date; endsAt: Date },
  now = new Date(),
) {
  return offer.published && offer.startsAt <= now && offer.endsAt > now;
}
export type Dish = {
  id: string;
  name: string;
  description: string;
  category: { id: string; name: string };
  price: number | null;
  kind: string;
  available: boolean;
  featured: boolean;
  imageId: string | null;
  demo: boolean;
};
export const demoDishes: Dish[] = [
  'Mutton Biryani',
  'Egg Biryani',
  'Chicken Bucket Biryani',
  'Parotta Combo',
  'Chicken Kari Dosai',
  'Mutton Kari Dosai',
  'Mutton Chukka',
  'Garlic Chicken Gravy',
].map((name, i) => ({
  id: `demo-${i}`,
  name,
  description: 'Provisional dish · owner confirmation required',
  category: {
    id: categories[[0, 0, 1, 2, 3, 3, 4, 4][i]],
    name: categories[[0, 0, 1, 2, 3, 3, 4, 4][i]],
  },
  price: null,
  kind: 'NON_VEG',
  available: false,
  featured: i < 3,
  imageId: null,
  demo: true,
}));
export function filterDishes(items: Dish[], query: string, category: string, kind: string) {
  return items.filter(
    (x) =>
      x.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (!category || x.category.id === category || x.category.name === category) &&
      (!kind || x.kind === kind),
  );
}
