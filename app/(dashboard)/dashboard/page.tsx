import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return null;
  }

  // Fetch dashboard stats
  const [opportunityCount, proposalCount, recentOpportunities] = await Promise.all([
    prisma.opportunity.count({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.proposal.count({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.opportunity.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        proposals: {
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <Button asChild>
          <Link href="/opportunities/new">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Opportunity
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunityCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Opportunities</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentOpportunities.filter(o => o.status === 'open').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Opportunities</CardTitle>
          <CardDescription>Your latest opportunities and their proposal status</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No opportunities yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating your first opportunity to generate AI-powered proposals.
              </p>
              <Button asChild className="mt-4">
                <Link href="/opportunities/new">Create your first opportunity</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOpportunities.map((opportunity) => (
                <Link
                  key={opportunity.id}
                  href={`/opportunities/${opportunity.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{opportunity.name}</p>
                      {opportunity.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {opportunity.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        opportunity.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : opportunity.status === 'won'
                          ? 'bg-blue-100 text-blue-800'
                          : opportunity.status === 'lost'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {opportunity.status}
                      </span>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
              <div className="pt-4">
                <Link
                  href="/opportunities"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all opportunities →
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
