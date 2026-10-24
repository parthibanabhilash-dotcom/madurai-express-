import { InputError } from './errors';
import { z } from 'zod';
export const safeUrl = z
  .string()
  .url()
  .refine((v) => new URL(v).protocol === 'https:', 'Use an HTTPS URL');
export const menuSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(1000),
    categoryId: z.string().min(1),
    imageId: z.string().nullable(),
    price: z.number().int().min(0).max(100000000).nullable(),
    kind: z.enum(['VEG', 'NON_VEG']),
    available: z.boolean(),
    featured: z.boolean(),
    published: z.boolean(),
    demo: z.boolean(),
  })
  .refine((v) => !(v.demo && v.published), 'Demo items must remain drafts');
export const hoursSchema = z
  .array(
    z.object({
      day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
      closed: z.boolean(),
      open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    }),
  )
  .length(7)
  .refine((v) => new Set(v.map((x) => x.day)).size === 7, 'Each weekday is required once');
export function validateOffer(start: string, end: string) {
  const startsAt = new Date(start + '+05:30'),
    endsAt = new Date(end + '+05:30');
  if (!Number.isFinite(+startsAt) || !Number.isFinite(+endsAt) || endsAt <= startsAt)
    throw new InputError('Offer expiry must be after its start.');
  return { startsAt, endsAt };
}
