import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { BattlecardForm } from '@/components/knowledge/battlecard-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBattlecardPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.organizationId) {
    return null;
  }

  const battlecard = await prisma.battlecard.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  if (!battlecard) {
    notFound();
  }

  const structuredContent = battlecard.structuredContent as {
    strengths?: string[];
    weaknesses?: string[];
    objectionHandling?: Array<{ objection: string; response: string }>;
    keyDifferentiators?: string[];
    pricingIntel?: string;
    targetMarket?: string;
  } | null;

  const initialData = {
    competitorName: battlecard.competitorName,
    competitorWebsite: battlecard.competitorWebsite || '',
    rawContent: battlecard.rawContent || '',
    structuredContent: {
      strengths: structuredContent?.strengths || [],
      weaknesses: structuredContent?.weaknesses || [],
      objectionHandling: structuredContent?.objectionHandling || [],
      keyDifferentiators: structuredContent?.keyDifferentiators || [],
      pricingIntel: structuredContent?.pricingIntel || '',
      targetMarket: structuredContent?.targetMarket || '',
    },
    isActive: battlecard.isActive,
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/knowledge/battlecards" className="hover:text-gray-700">
            Battlecards
          </Link>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-700">{battlecard.competitorName}</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Edit Battlecard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Update competitive intelligence for {battlecard.competitorName}.
        </p>
      </div>

      <BattlecardForm initialData={initialData} battlecardId={id} isEdit />
    </div>
  );
}
