'use server';
import { db } from '@/lib/db';
import { checkMutation, checkOrigin, hash, token, consumeLoginAttempt } from '@/lib/auth';
import { menuSchema, hoursSchema, safeUrl, validateOffer } from '@/lib/validation';
import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { uploadImage } from '@/lib/storage';
import { InputError } from '@/lib/errors';
const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const yes = (f: FormData, k: string) => f.get(k) === 'on';
export type Result = { error?: string; success?: string };
export async function login(_: Result, form: FormData): Promise<Result> {
  try {
    await checkOrigin();
    const jar = await cookies();
    if (!form.get('csrf') || jar.get('mm_login_csrf')?.value !== form.get('csrf'))
      return { error: 'Session expired. Refresh the page.' };
    const email = z.string().email().max(254).parse(str(form, 'email').toLowerCase());
    const password = z
      .string()
      .min(1)
      .max(256)
      .refine((v) => Buffer.byteLength(v, 'utf8') <= 72)
      .parse(String(form.get('password') ?? ''));
    const key = hash(email);
    if (!(await consumeLoginAttempt(key)))
      return { error: 'Too many attempts. Try again in 15 minutes.' };
    const admin = await db.admin.findUnique({ where: { email } });
    const valid = await compare(
      password,
      admin?.passwordHash ?? '$2b$12$HsKh5DZbK9LCKbpJLeMUIuY41V7KJ56FLDyTZNFZ9YG1IK2QAY6sS',
    );
    if (!admin || !valid) return { error: 'Email or password is incorrect.' };
    const raw = token();
    await db.session.create({
      data: {
        id: hash(raw),
        adminId: admin.id,
        csrf: token(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });
    jar.set('mm_session', raw, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 60 * 60,
    });
    jar.delete('mm_login_csrf');
  } catch {
    return { error: 'Unable to sign in. Check your details and database connection.' };
  }
  redirect('/admin');
}
export async function mutate(_: Result, form: FormData): Promise<Result> {
  try {
    const s = await checkMutation(form);
    const action = str(form, 'action'),
      id = str(form, 'id');
    if (action === 'logout') {
      await db.session.delete({ where: { id: s.id } });
      (await cookies()).delete('mm_session');
    } else if (action === 'category') {
      const name = z.string().min(1).max(80).parse(str(form, 'name'));
      if (id) await db.category.update({ where: { id }, data: { name } });
      else await db.category.create({ data: { name } });
    } else if (action === 'delete-category') {
      if (await db.menuItem.count({ where: { categoryId: id } }))
        throw new InputError('Move or delete the dishes in this category first.');
      await db.category.delete({ where: { id } });
    } else if (action === 'item') {
      const rawPrice = str(form, 'price');
      if (rawPrice && !/^\d+(\.\d{1,2})?$/.test(rawPrice))
        throw new InputError('Enter a price with at most two decimal places, or leave it blank.');
      const data = menuSchema.parse({
        name: str(form, 'name'),
        description: str(form, 'description'),
        categoryId: str(form, 'categoryId'),
        imageId: str(form, 'imageId') || null,
        price: rawPrice ? Math.round(Number(rawPrice) * 100) : null,
        kind: str(form, 'kind'),
        available: yes(form, 'available'),
        featured: yes(form, 'featured'),
        published: yes(form, 'published'),
        demo: yes(form, 'demo'),
      });
      if (data.imageId && !(await db.image.findUnique({ where: { id: data.imageId } })))
        throw new InputError('Image not found');
      if (!(await db.category.findUnique({ where: { id: data.categoryId } })))
        throw new InputError('Category not found');
      if (id && !(await db.menuItem.findUnique({ where: { id } })))
        throw new InputError('Menu item not found');
      const photo = form.get('dishPhoto');
      let key: string | undefined;
      if (photo instanceof File && photo.size > 0) {
        if (photo.size > 4 * 1024 * 1024)
          throw new InputError('Choose a dish photo smaller than 4 MB.');
        try {
          key = await uploadImage(photo);
        } catch (error) {
          if (error instanceof InputError) throw error;
          throw new InputError(
            'Photo upload failed. Check image-storage configuration and database migrations. Your dish was not changed.',
          );
        }
      }
      await db.$transaction(async (tx) => {
        if (key) {
          const image = await tx.image.create({
            data: { key, alt: data.name, group: 'Food', gallery: false },
          });
          data.imageId = image.id;
        }
        if (id) await tx.menuItem.update({ where: { id }, data });
        else await tx.menuItem.create({ data });
      });
    } else if (action === 'delete-item') await db.menuItem.delete({ where: { id } });
    else if (action === 'offer') {
      const data = {
        title: z.string().min(1).max(150).parse(str(form, 'title')),
        description: z.string().max(1500).parse(str(form, 'description')),
        published: yes(form, 'published'),
        ...validateOffer(str(form, 'startsAt'), str(form, 'endsAt')),
      };
      if (id) await db.offer.update({ where: { id }, data });
      else await db.offer.create({ data });
    } else if (action === 'delete-offer') await db.offer.delete({ where: { id } });
    else if (action === 'upload') {
      const file = form.get('file');
      if (!(file instanceof File)) throw new InputError('Choose an image.');
      const meta = {
        alt: z.string().min(1).max(250).parse(str(form, 'alt')),
        caption: z.string().max(500).parse(str(form, 'caption')),
        group: z.enum(['Food', 'Restaurant']).parse(str(form, 'group')),
        gallery: yes(form, 'gallery'),
      };
      const key = await uploadImage(file);
      await db.image.create({ data: { key, ...meta } });
    } else if (action === 'image') {
      await db.image.update({
        where: { id },
        data: {
          alt: z.string().min(1).max(250).parse(str(form, 'alt')),
          caption: z.string().max(500).parse(str(form, 'caption')),
          group: z.enum(['Food', 'Restaurant']).parse(str(form, 'group')),
          gallery: yes(form, 'gallery'),
        },
      });
    } else if (action === 'delete-image') {
      if (await db.menuItem.count({ where: { imageId: id } }))
        throw new InputError('Remove this image from menu items first.');
      await db.$transaction(async (tx) => {
        const image = await tx.image.delete({ where: { id } });
        if (image.key.startsWith('database/'))
          await tx.imageObject.deleteMany({ where: { key: image.key } });
      });
    } else if (action === 'settings') {
      const whatsappEnabled = yes(form, 'whatsappEnabled');
      const whatsappNumber = str(form, 'whatsappNumber');
      if (whatsappEnabled && !/^\+?[1-9]\d{9,14}$/.test(whatsappNumber))
        throw new InputError('Enter a confirmed international WhatsApp number.');
      const hoursText = str(form, 'hours');
      const hours = hoursText ? hoursSchema.parse(JSON.parse(hoursText)) : undefined;
      const data = {
        phone: z
          .string()
          .regex(/^\+?[1-9]\d{9,14}$/)
          .parse(str(form, 'phone')),
        address: z.string().min(1).max(500).parse(str(form, 'address')),
        addressConfirmed: yes(form, 'addressConfirmed'),
        mapUrl: safeUrl.parse(str(form, 'mapUrl')),
        mapConfirmed: yes(form, 'mapConfirmed'),
        orderUrl: str(form, 'orderUrl')
          ? safeUrl
              .refine(
                (v) =>
                  new URL(v).hostname === 'www.swiggy.com' || new URL(v).hostname === 'swiggy.com',
                'Use a Swiggy URL',
              )
              .parse(str(form, 'orderUrl'))
          : '',
        whatsappEnabled,
        whatsappNumber,
      };
      await db.settings.upsert({
        where: { id: 'business' },
        create: { ...data, hours: hours ?? [] },
        update: { ...data, hours: hours ?? [] },
      });
    } else throw new InputError('Unknown action');
    revalidatePath('/', 'layout');
    return { success: 'Changes saved.' };
  } catch (e) {
    return {
      error:
        e instanceof z.ZodError
          ? e.issues.map((i) => i.message).join(' ')
          : e instanceof InputError
            ? e.message
            : 'Unable to save changes.',
    };
  }
}
