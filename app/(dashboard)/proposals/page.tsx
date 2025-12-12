'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Proposal {
  id: string;
  version: number;
  status: string;
  prompt: string | null;
  createdAt: string;
  opportunity: {
    id: string;
    name: string;
  };
}

export default function ProposalsListPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/v1/proposals');
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    queued: 'bg-yellow-100 text-yellow-800',
    generating: 'bg-blue-100 text-blue-800',
    complete: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500">
            All proposals across your opportunities
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Loading proposals...</p>
          </CardContent>
        </Card>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No proposals yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create a proposal from an opportunity to get started.
            </p>
            <Button onClick={() => router.push('/opportunities')}>
              View Opportunities
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/opportunities/${proposal.opportunity.id}`}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      {proposal.opportunity.name}
                    </Link>
                    <CardTitle className="text-lg">
                      Version {proposal.version}
                    </CardTitle>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[proposal.status] || 'bg-gray-100'
                    }`}
                  >
                    {proposal.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {proposal.prompt || 'No prompt recorded'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Created {new Date(proposal.createdAt).toLocaleDateString()}
                  </span>
                  {proposal.status === 'complete' ? (
                    <Link
                      href={`/proposals/${proposal.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Proposal
                    </Link>
                  ) : proposal.status === 'generating' ||
                    proposal.status === 'queued' ? (
                    <Link
                      href={`/proposals/${proposal.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Progress
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
