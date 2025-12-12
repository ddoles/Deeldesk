import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const statusColors = {
  open: 'bg-green-100 text-green-800',
  won: 'bg-blue-100 text-blue-800',
  lost: 'bg-red-100 text-red-800',
  stalled: 'bg-yellow-100 text-yellow-800',
};

const proposalStatusColors = {
  draft: 'bg-gray-100 text-gray-800',
  queued: 'bg-yellow-100 text-yellow-800',
  generating: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.organizationId) {
    return null;
  }

  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      proposals: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          version: true,
          status: true,
          prompt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      dealContextItems: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sourceType: true,
          createdAt: true,
        },
      },
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/opportunities" className="hover:text-gray-700">
              Opportunities
            </Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-gray-700">{opportunity.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{opportunity.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[opportunity.status]}`}>
              {opportunity.status}
            </span>
          </div>
          {opportunity.description && (
            <p className="mt-1 text-sm text-gray-500">{opportunity.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/opportunities/${opportunity.id}/edit`}>
              Edit
            </Link>
          </Button>
          {opportunity.status === 'open' && (
            <Button asChild>
              <Link href={`/opportunities/${opportunity.id}/proposals/new`}>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Generate Proposal
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Expected Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {opportunity.expectedValue
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: opportunity.currency || 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(Number(opportunity.expectedValue))
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Expected Close</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {opportunity.expectedCloseDate
                ? new Date(opportunity.expectedCloseDate).toLocaleDateString()
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{opportunity.user.name || opportunity.user.email}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proposals</CardTitle>
                <CardDescription>
                  {opportunity.proposals.length} {opportunity.proposals.length === 1 ? 'proposal' : 'proposals'} generated
                </CardDescription>
              </div>
              {opportunity.status === 'open' && (
                <Button size="sm" asChild>
                  <Link href={`/opportunities/${opportunity.id}/proposals/new`}>
                    New Proposal
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {opportunity.proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No proposals yet</p>
                {opportunity.status === 'open' && (
                  <Button size="sm" className="mt-4" asChild>
                    <Link href={`/opportunities/${opportunity.id}/proposals/new`}>
                      Generate your first proposal
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {opportunity.proposals.map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={`/proposals/${proposal.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50">
                      <div>
                        <p className="font-medium">Version {proposal.version}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {proposal.prompt || 'No prompt'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${proposalStatusColors[proposal.status]}`}>
                          {proposal.status}
                        </span>
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Deal Context</CardTitle>
                <CardDescription>
                  {opportunity.dealContextItems.length} context {opportunity.dealContextItems.length === 1 ? 'item' : 'items'}
                </CardDescription>
              </div>
              {opportunity.status === 'open' && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/opportunities/${opportunity.id}/context/new`}>
                    Add Context
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {opportunity.dealContextItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No deal context added</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add emails, notes, or call transcripts to improve proposal quality
                </p>
                {opportunity.status === 'open' && (
                  <Button size="sm" variant="outline" className="mt-4" asChild>
                    <Link href={`/opportunities/${opportunity.id}/context/new`}>
                      Add context
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {opportunity.dealContextItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {item.sourceType.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Opportunity created</p>
                <p className="text-xs text-gray-500">
                  {new Date(opportunity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {opportunity.closedAt && (
              <div className="flex gap-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  opportunity.status === 'won' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <svg className={`h-4 w-4 ${opportunity.status === 'won' ? 'text-green-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    {opportunity.status === 'won' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Opportunity marked as {opportunity.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(opportunity.closedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
