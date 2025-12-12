import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
    newUser: '/onboarding',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAuth = nextUrl.pathname.startsWith('/sign-in') ||
                       nextUrl.pathname.startsWith('/sign-up');
      const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');
      const isOnPublicShare = nextUrl.pathname.startsWith('/share');

      // Allow public share routes
      if (isOnPublicShare) {
        return true;
      }

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      // Protect dashboard routes
      if (isOnDashboard || isOnOnboarding) {
        if (isLoggedIn) return true;
        return false; // Redirect to sign-in
      }

      return true;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
