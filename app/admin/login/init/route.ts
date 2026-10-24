import { NextRequest, NextResponse } from 'next/server';
import { token } from '@/lib/auth';
export function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/login', req.url));
  response.cookies.set('mm_login_csrf', token(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 3600,
  });
  return response;
}
