import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Match all routes except static files, api routes that don't need auth, and public assets
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
