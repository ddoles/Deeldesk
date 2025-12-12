import { User, Organization, OrganizationMembership, OrgRole, PlanTier } from '@prisma/client';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  emailVerified: new Date(),
  name: 'Test User',
  image: null,
  passwordHash: null,
  preferences: {},
  isPlatformAdmin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  ...overrides,
});

export const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'org-123',
  name: 'Test Organization',
  slug: 'test-org',
  planTier: 'free' as PlanTier,
  maxProposalsPerMonth: 5,
  maxKnowledgeItems: 50,
  maxCompetitors: 3,
  settings: {},
  features: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockMembership = (
  overrides: Partial<OrganizationMembership> = {}
): OrganizationMembership => ({
  id: 'membership-123',
  organizationId: 'org-123',
  userId: 'user-123',
  role: 'owner' as OrgRole,
  isDefault: true,
  invitedById: null,
  invitedAt: null,
  acceptedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    organizationId: 'org-123',
    organizationRole: 'owner' as OrgRole,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});
