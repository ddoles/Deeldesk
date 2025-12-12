export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          Deeldesk.ai
        </h1>
        <p className="text-xl text-secondary-600 mb-8">
          AI-Powered Proposal Generation
        </p>
        <div className="bg-secondary-100 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-secondary-800 mb-2">
            Phase 0: Technical De-Risking
          </h2>
          <p className="text-secondary-600 text-sm">
            Development environment ready. Run the Phase 0 spikes to validate technical assumptions.
          </p>
        </div>
      </div>
    </main>
  );
}
