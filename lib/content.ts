import { suggestedMenu } from './suggested-menu';
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
// Preserve the existing draft identifiers so re-seeding never duplicates or overwrites edits.
const legacyDemoIds: Record<string, string> = {
  'Mutton Biryani': 'demo-0',
  'Egg Biryani': 'demo-1',
  'Chicken Bucket Biryani': 'demo-2',
  'Parotta Combo': 'demo-3',
  'Chicken Kari Dosai': 'demo-4',
  'Mutton Kari Dosai': 'demo-5',
  'Mutton Chukka': 'demo-6',
  'Garlic Chicken Gravy': 'demo-7',
};
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export const demoDishes: Dish[] = categories.flatMap((category) =>
  suggestedMenu[category].map(([name, kind]) => {
    const id = legacyDemoIds[name] ?? `demo-${slug(category)}-${slug(name)}`;
    return {
      id,
      name,
      description:
        'Suggested example only. Menu, classification and availability need owner confirmation.',
      category: { id: category, name: category },
      price: null,
      kind,
      available: false,
      featured: ['demo-0', 'demo-1', 'demo-2'].includes(id),
      imageId: null,
      demo: true,
    };
  }),
);
export function filterDishes(items: Dish[], query: string, category: string, kind: string) {
  return items.filter(
    (x) =>
      x.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (!category || x.category.id === category || x.category.name === category) &&
      (!kind || x.kind === kind),
  );
}
