import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserActions } from './user-actions';

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      memberships: {
        include: { organization: true },
      },
      _count: {
        select: {
          opportunities: true,
          proposals: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">
          Manage all users on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users.length} users total</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-gray-500">
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">Stats</th>
                    <th className="pb-3 pr-4">Last Login</th>
                    <th className="pb-3 pr-4">Created</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 align-top">
                      <td className="py-3 pr-4">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.name || 'Unnamed'}</p>
                              {user.isPlatformAdmin && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                  Platform Admin
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400 mt-1">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        <div className="space-y-1">
                          <p>{user._count.opportunities} opportunities</p>
                          <p>{user._count.proposals} proposals</p>
                          <p className="text-gray-500">{user.memberships.length} org(s)</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-500">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <UserActions
                          userId={user.id}
                          isPlatformAdmin={user.isPlatformAdmin}
                          memberships={user.memberships.map((m) => ({
                            id: m.id,
                            role: m.role,
                            organization: {
                              id: m.organization.id,
                              name: m.organization.name,
                            },
                          }))}
                          currentUserId={session!.user.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
