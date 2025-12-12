import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgSettingsForm } from './org-settings-form';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return null;
  }

  // Check if user has permission to edit settings (owner or admin)
  const canEdit = session.user.organizationRole === 'owner' || session.user.organizationRole === 'admin';

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            {canEdit
              ? 'Update your organization name and settings'
              : 'View your organization details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm organization={organization} canEdit={canEdit} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>Your current subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{organization.planTier} Plan</p>
              <p className="text-sm text-gray-500">
                {organization.maxProposalsPerMonth === null
                  ? 'Unlimited proposals'
                  : `${organization.maxProposalsPerMonth} proposals/month`}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              organization.planTier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
              organization.planTier === 'team' ? 'bg-blue-100 text-blue-800' :
              organization.planTier === 'pro' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {organization.planTier}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
