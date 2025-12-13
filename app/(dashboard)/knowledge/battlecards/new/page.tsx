import Link from 'next/link';
import { BattlecardForm } from '@/components/knowledge/battlecard-form';

export default function NewBattlecardPage() {
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
          <span className="text-gray-700">New Battlecard</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Add New Battlecard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add competitive intelligence to help win against this competitor.
        </p>
      </div>

      <BattlecardForm />
    </div>
  );
}
