import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { UserMenu } from '@/components/layout/user-menu';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {/* Page title will be set by each page */}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
