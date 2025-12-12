import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env manually
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });

  return env;
}

const env = loadEnv();

const results = {
  anthropic: { status: 'pending', message: '' },
  openai: { status: 'pending', message: '' },
  bedrock: { status: 'pending', message: '' },
};

// Test Anthropic
async function testAnthropic() {
  console.log('\n🔍 Testing Anthropic API...');

  if (!env.ANTHROPIC_API_KEY) {
    results.anthropic = { status: 'failed', message: 'ANTHROPIC_API_KEY not set in .env' };
    return;
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "Anthropic API working!" in exactly 4 words.' }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    results.anthropic = {
      status: 'success',
      message: `Response: "${text.trim()}"`,
      model: response.model,
    };
    console.log('✅ Anthropic API: SUCCESS');
  } catch (error) {
    results.anthropic = { status: 'failed', message: error.message };
    console.log('❌ Anthropic API: FAILED -', error.message);
  }
}

// Test OpenAI
async function testOpenAI() {
  console.log('\n🔍 Testing OpenAI API...');

  if (!env.OPENAI_API_KEY) {
    results.openai = { status: 'failed', message: 'OPENAI_API_KEY not set in .env' };
    return;
  }

  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const embedding = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'Test embedding for Deeldesk',
    });

    results.openai = {
      status: 'success',
      message: `Embedding generated (${embedding.data[0].embedding.length} dimensions)`,
      model: embedding.model,
    };
    console.log('✅ OpenAI API: SUCCESS');
  } catch (error) {
    results.openai = { status: 'failed', message: error.message };
    console.log('❌ OpenAI API: FAILED -', error.message);
  }
}

// Test AWS Bedrock
async function testBedrock() {
  console.log('\n🔍 Testing AWS Bedrock...');

  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    results.bedrock = { status: 'failed', message: 'AWS credentials not set in .env' };
    return;
  }

  try {
    const client = new BedrockRuntimeClient({
      region: env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        ...(env.AWS_SESSION_TOKEN && { sessionToken: env.AWS_SESSION_TOKEN }),
      },
    });

    const modelId = env.BEDROCK_CLAUDE_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "Bedrock API working!" in exactly 4 words.' }],
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.content[0].text;

    results.bedrock = {
      status: 'success',
      message: `Response: "${text.trim()}"`,
      model: modelId,
      region: env.AWS_REGION || 'us-east-1'
    };
    console.log('✅ AWS Bedrock: SUCCESS');
  } catch (error) {
    let message = error.message;
    if (error.name === 'AccessDeniedException') {
      message = 'Access denied. Ensure Claude model is enabled in AWS Bedrock console.';
    }
    results.bedrock = { status: 'failed', message };
    console.log('❌ AWS Bedrock: FAILED -', message);
  }
}

// Run all tests
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Deeldesk.ai - API Key Verification');
  console.log('═══════════════════════════════════════════════════════');

  await testAnthropic();
  await testOpenAI();
  await testBedrock();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  const icon = (s) => s === 'success' ? '✅' : '❌';

  console.log(`\n${icon(results.anthropic.status)} Anthropic API`);
  console.log(`   ${results.anthropic.message}`);
  if (results.anthropic.model) console.log(`   Model: ${results.anthropic.model}`);

  console.log(`\n${icon(results.openai.status)} OpenAI API`);
  console.log(`   ${results.openai.message}`);
  if (results.openai.model) console.log(`   Model: ${results.openai.model}`);

  console.log(`\n${icon(results.bedrock.status)} AWS Bedrock`);
  console.log(`   ${results.bedrock.message}`);
  if (results.bedrock.model) console.log(`   Model: ${results.bedrock.model}`);
  if (results.bedrock.region) console.log(`   Region: ${results.bedrock.region}`);

  const allPassed = Object.values(results).every(r => r.status === 'success');

  console.log('\n═══════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('  🎉 All API keys verified successfully!');
    console.log('  You are ready to start Phase 0 spikes.');
  } else {
    console.log('  ⚠️  Some API keys need attention.');
  }
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
}

main();
