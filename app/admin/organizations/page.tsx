import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const planColors = {
  free: 'bg-gray-100 text-gray-800',
  pro: 'bg-green-100 text-green-800',
  team: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-purple-100 text-purple-800',
};

export default async function AdminOrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          memberships: true,
          opportunities: true,
          proposals: true,
        },
      },
      memberships: {
        where: { role: 'owner' },
        include: { user: true },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <p className="text-sm text-gray-500">
          Manage all organizations on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>{organizations.length} organizations total</CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No organizations yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-gray-500">
                    <th className="pb-3 pr-4">Organization</th>
                    <th className="pb-3 pr-4">Owner</th>
                    <th className="pb-3 pr-4">Plan</th>
                    <th className="pb-3 pr-4">Members</th>
                    <th className="pb-3 pr-4">Opportunities</th>
                    <th className="pb-3 pr-4">Proposals</th>
                    <th className="pb-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-gray-500">{org.slug}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="text-sm">{org.memberships[0]?.user.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{org.memberships[0]?.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${planColors[org.planTier]}`}>
                          {org.planTier}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm">{org._count.memberships}</td>
                      <td className="py-3 pr-4 text-sm">{org._count.opportunities}</td>
                      <td className="py-3 pr-4 text-sm">{org._count.proposals}</td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(org.createdAt).toLocaleDateString()}
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
