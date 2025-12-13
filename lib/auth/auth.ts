import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { authConfig } from './auth.config';
import type { OrgRole } from '@prisma/client';

// Extended types for session and JWT
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      organizationId: string;
      organizationRole: OrgRole;
      isPlatformAdmin: boolean;
    };
  }

  interface JWT {
    id: string;
    organizationId: string;
    organizationRole: OrgRole;
    isPlatformAdmin: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              where: { isDefault: true },
              include: { organization: true },
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, handle user creation and organization setup
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // New OAuth user - will be handled by jwt callback
          return true;
        }
      }

      return true;
    },
    async jwt({ token, user, account, trigger: _trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;

        // Find or create user and organization
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            memberships: {
              where: { isDefault: true },
              include: { organization: true },
            },
          },
        });

        // Handle new OAuth user creation
        if (!dbUser && account?.provider === 'google') {
          // Create user and organization in a transaction
          const result = await prisma.$transaction(async (tx) => {
            // Create organization
            const org = await tx.organization.create({
              data: {
                name: `${user.name || user.email}'s Organization`,
                slug: generateSlug(user.email!),
                planTier: 'free',
              },
            });

            // Create user
            const newUser = await tx.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
              },
            });

            // Create membership
            await tx.organizationMembership.create({
              data: {
                userId: newUser.id,
                organizationId: org.id,
                role: 'owner',
                isDefault: true,
                acceptedAt: new Date(),
              },
            });

            // Create account link
            await tx.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at ? Number(account.expires_at) : null,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });

            return { user: newUser, organization: org };
          });

          token.id = result.user.id;
          token.organizationId = result.organization.id;
          token.organizationRole = 'owner';
          token.isPlatformAdmin = false; // New users are never platform admins
        } else if (dbUser) {
          token.id = dbUser.id;
          token.isPlatformAdmin = dbUser.isPlatformAdmin;

          // Get default organization membership
          const defaultMembership = dbUser.memberships[0];
          if (defaultMembership) {
            token.organizationId = defaultMembership.organizationId;
            token.organizationRole = defaultMembership.role;
          }

          // Update last login
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date() },
          });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationRole = token.organizationRole as OrgRole;
        session.user.isPlatformAdmin = (token.isPlatformAdmin as boolean) ?? false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (!isNewUser) {
        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {
          // Ignore if user doesn't exist yet (handled in jwt callback)
        });
      }
    },
  },
});

// Helper function to generate a unique slug
function generateSlug(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}
