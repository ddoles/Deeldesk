/**
 * Proposal Generation Worker
 *
 * Run this script to start the BullMQ worker that processes proposal generation jobs.
 *
 * Usage:
 *   npx tsx scripts/start-worker.ts
 *
 * Or add to package.json scripts:
 *   "worker": "tsx scripts/start-worker.ts"
 */

// MUST load environment BEFORE any other imports
import { readFileSync } from 'fs';
import { join } from 'path';

// Manually parse .env file since dotenv v17 has issues
const envPath = join(process.cwd(), '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Always set, don't skip existing
        process.env[key] = value;
      }
    }
  }
} catch (err) {
  console.error('Failed to load .env file:', err);
  process.exit(1);
}

// Verify API key is loaded
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not found in .env file');
  process.exit(1);
}
console.log('Environment loaded successfully');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY.substring(0, 15) + '...');

// NOW import modules that depend on env vars
async function main() {
  const { startProposalWorker } = await import('../lib/queue/proposal-queue');

  console.log('Starting proposal generation worker...');

  const worker = startProposalWorker();

  console.log('Worker started. Listening for jobs...');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down worker...');
    await worker.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
