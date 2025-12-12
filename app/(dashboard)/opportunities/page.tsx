import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const statusColors = {
  open: 'bg-green-100 text-green-800',
  won: 'bg-blue-100 text-blue-800',
  lost: 'bg-red-100 text-red-800',
  stalled: 'bg-yellow-100 text-yellow-800',
};

export default async function OpportunitiesPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return null;
  }

  const opportunities = await prisma.opportunity.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { updatedAt: 'desc' },
    include: {
      proposals: {
        select: { id: true, status: true, version: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: { proposals: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-500">
            Manage your sales opportunities and generate proposals
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

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
            <h3 className="mt-6 text-lg font-semibold text-gray-900">No opportunities yet</h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Get started by creating your first opportunity. You'll be able to generate AI-powered proposals for each opportunity you create.
            </p>
            <Button asChild className="mt-6">
              <Link href="/opportunities/new">Create your first opportunity</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {opportunities.map((opportunity) => (
            <Link key={opportunity.id} href={`/opportunities/${opportunity.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{opportunity.name}</CardTitle>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[opportunity.status]}`}>
                      {opportunity.status}
                    </span>
                  </div>
                  {opportunity.description && (
                    <CardDescription className="line-clamp-2">
                      {opportunity.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        {opportunity._count.proposals} {opportunity._count.proposals === 1 ? 'proposal' : 'proposals'}
                      </span>
                      {opportunity.expectedValue && (
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: opportunity.currency || 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(Number(opportunity.expectedValue))}
                        </span>
                      )}
                    </div>
                    <span>
                      Updated {new Date(opportunity.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
