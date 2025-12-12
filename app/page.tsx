import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-xl font-bold">Deeldesk.ai</span>
        <div className="flex gap-4">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            AI-Powered Proposal Generation
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Generate professional, brand-compliant proposals in minutes. The first system of record for sales strategy.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/sign-up">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3 max-w-5xl">
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">10x Faster Proposals</h3>
            <p className="text-gray-600 text-sm">
              Generate professional proposals from natural language prompts in minutes, not hours.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Zero Cold Start</h3>
            <p className="text-gray-600 text-sm">
              Get immediate value as an individual seller without requiring team adoption.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Strategy Capture</h3>
            <p className="text-gray-600 text-sm">
              Automatically capture positioning, pricing, and solutioning decisions from every proposal.
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t py-8 px-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Deeldesk.ai. All rights reserved.</p>
      </footer>
    </main>
  );
}
