import { KnowledgeNav } from './knowledge-nav';

// Force dynamic rendering for all knowledge pages
export const dynamic = 'force-dynamic';

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your products, competitive intelligence, and company information
        </p>
      </div>

      <KnowledgeNav />

      {children}
    </div>
  );
}
