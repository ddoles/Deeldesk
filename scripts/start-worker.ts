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
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Manually parse .env file since dotenv v17 has issues
// In production (Railway), env vars are provided by the platform, so .env is optional
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
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
    console.log('Loaded environment from .env file');
  } catch (err) {
    console.error('Failed to load .env file:', err);
    process.exit(1);
  }
} else {
  console.log('No .env file found, using environment variables from platform');
}

// Verify required environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not set');
  process.exit(1);
}
if (!process.env.REDIS_URL) {
  console.error('ERROR: REDIS_URL not set');
  process.exit(1);
}
console.log('Environment loaded successfully');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY.substring(0, 15) + '...');
console.log('REDIS_URL:', process.env.REDIS_URL ? 'set' : 'not set');

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
