'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Battlecard {
  id: string;
  competitorName: string;
  competitorWebsite: string | null;
  rawContent: string | null;
  structuredContent: {
    strengths?: string[];
    weaknesses?: string[];
    keyDifferentiators?: string[];
  } | null;
  lastReviewedAt: string | null;
  isStale: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BattlecardsPage() {
  const [battlecards, setBattlecards] = useState<Battlecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBattlecards();
  }, [search]);

  async function fetchBattlecards() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const response = await fetch(`/api/v1/knowledge/battlecards?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBattlecards(data.battlecards);
      }
    } catch (error) {
      console.error('Failed to fetch battlecards:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteBattlecard(id: string) {
    if (!confirm('Are you sure you want to delete this battlecard?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/knowledge/battlecards/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBattlecards(battlecards.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete battlecard:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Search competitors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <Button asChild>
          <Link href="/knowledge/battlecards/new">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Battlecard
          </Link>
        </Button>
      </div>

      {battlecards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No battlecards yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add competitive intelligence to help generate winning proposals.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/knowledge/battlecards/new">Add your first battlecard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {battlecards.map((battlecard) => (
            <Card key={battlecard.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{battlecard.competitorName}</CardTitle>
                    {battlecard.competitorWebsite && (
                      <a
                        href={battlecard.competitorWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block"
                      >
                        {battlecard.competitorWebsite}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/knowledge/battlecards/${battlecard.id}`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBattlecard(battlecard.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {battlecard.isStale && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      Needs Review
                    </span>
                  )}
                  {!battlecard.isActive && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>

                {battlecard.rawContent && (
                  <CardDescription className="line-clamp-2 mb-3">
                    {battlecard.rawContent}
                  </CardDescription>
                )}

                {battlecard.structuredContent && (
                  <div className="space-y-2 text-sm">
                    {battlecard.structuredContent.strengths && battlecard.structuredContent.strengths.length > 0 && (
                      <div>
                        <span className="font-medium text-green-700">Strengths:</span>{' '}
                        <span className="text-gray-600">{battlecard.structuredContent.strengths.slice(0, 2).join(', ')}</span>
                        {battlecard.structuredContent.strengths.length > 2 && (
                          <span className="text-gray-400"> +{battlecard.structuredContent.strengths.length - 2}</span>
                        )}
                      </div>
                    )}
                    {battlecard.structuredContent.weaknesses && battlecard.structuredContent.weaknesses.length > 0 && (
                      <div>
                        <span className="font-medium text-red-700">Weaknesses:</span>{' '}
                        <span className="text-gray-600">{battlecard.structuredContent.weaknesses.slice(0, 2).join(', ')}</span>
                        {battlecard.structuredContent.weaknesses.length > 2 && (
                          <span className="text-gray-400"> +{battlecard.structuredContent.weaknesses.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {battlecard.lastReviewedAt && (
                  <p className="mt-3 text-xs text-gray-400">
                    Last reviewed: {new Date(battlecard.lastReviewedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
