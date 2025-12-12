import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const roleColors = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  manager: 'bg-green-100 text-green-800',
  member: 'bg-gray-100 text-gray-800',
  viewer: 'bg-gray-100 text-gray-600',
};

export default async function MembersPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return null;
  }

  const canManage = session.user.organizationRole === 'owner' || session.user.organizationRole === 'admin';

  const members = await prisma.organizationMembership.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      user: true,
      invitedBy: true,
    },
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>{members.length} members in your organization</CardDescription>
            </div>
            {canManage && (
              <p className="text-sm text-gray-500">
                Invite functionality coming soon
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No members found</p>
          ) : (
            <div className="space-y-3">
              {members.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600">
                      {membership.user.name?.[0]?.toUpperCase() || membership.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {membership.user.name || 'Unnamed'}
                        </p>
                        {membership.userId === session.user.id && (
                          <span className="text-xs text-gray-500">(you)</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{membership.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[membership.role]}`}>
                      {membership.role}
                    </span>
                    {membership.acceptedAt ? (
                      <span className="text-xs text-gray-500">
                        Joined {new Date(membership.acceptedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600">Pending invite</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>What each role can do in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex gap-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors.owner}`}>
                owner
              </span>
              <span className="text-gray-600">Full access, billing, can delete organization</span>
            </div>
            <div className="flex gap-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors.admin}`}>
                admin
              </span>
              <span className="text-gray-600">Manage members, settings, all content</span>
            </div>
            <div className="flex gap-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors.manager}`}>
                manager
              </span>
              <span className="text-gray-600">Create and manage opportunities and proposals</span>
            </div>
            <div className="flex gap-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors.member}`}>
                member
              </span>
              <span className="text-gray-600">Create opportunities and proposals</span>
            </div>
            <div className="flex gap-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors.viewer}`}>
                viewer
              </span>
              <span className="text-gray-600">View only access</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
