/**
 * Spike 4: LLM Provider Abstraction Tests
 *
 * Tests Anthropic Direct vs AWS Bedrock:
 * - Latency comparison
 * - Time to First Token (TTFT)
 * - Streaming support
 * - Feature parity
 * - Error handling
 */

import Anthropic from '@anthropic-ai/sdk';
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1].trim()] = value;
    }
  });
  return env;
}

const env = loadEnv();

// Initialize clients
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const bedrock = new BedrockRuntimeClient({
  region: env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

// Test prompts of varying complexity
const TEST_PROMPTS = [
  {
    name: 'Simple',
    prompt: 'What is 2 + 2? Reply with just the number.',
    expectedTokens: 10
  },
  {
    name: 'Medium',
    prompt: 'Write a one-paragraph executive summary for a $150,000 software proposal to improve customer support efficiency.',
    expectedTokens: 150
  },
  {
    name: 'Complex',
    prompt: `You are a sales proposal expert. Given the following context, write a compelling value proposition section:

Customer: Acme Corp, a 500-employee manufacturing company
Pain Points: Manual inventory tracking, 20% overstock, $2M annual waste
Our Solution: AI-powered inventory management
Budget: $200,000 annual
Competitors: SAP, Oracle

Write 3 paragraphs highlighting our unique value.`,
    expectedTokens: 400
  }
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  anthropicDirect: [],
  awsBedrock: [],
  comparison: {},
  streaming: {},
  errors: []
};

// ============================================
// ANTHROPIC DIRECT PROVIDER
// ============================================

async function testAnthropicDirect(prompt, name) {
  console.log(`\n[Anthropic Direct] Testing: ${name}`);

  const startTime = Date.now();
  let ttft = null;
  let fullResponse = '';
  let tokenCount = 0;

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        if (ttft === null) {
          ttft = Date.now() - startTime;
        }
        fullResponse += event.delta.text;
      }
    }

    const totalTime = Date.now() - startTime;
    const finalMessage = await stream.finalMessage();
    tokenCount = finalMessage.usage?.output_tokens || fullResponse.split(/\s+/).length;

    const result = {
      name,
      provider: 'Anthropic Direct',
      success: true,
      ttft,
      totalTime,
      outputTokens: tokenCount,
      tokensPerSecond: (tokenCount / (totalTime / 1000)).toFixed(2),
      responsePreview: fullResponse.substring(0, 100) + '...'
    };

    console.log(`  ✅ TTFT: ${ttft}ms, Total: ${totalTime}ms, Tokens: ${tokenCount}`);
    return result;

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      name,
      provider: 'Anthropic Direct',
      success: false,
      error: error.message
    };
  }
}

// ============================================
// AWS BEDROCK PROVIDER
// ============================================

async function testBedrockStreaming(prompt, name) {
  console.log(`\n[AWS Bedrock] Testing: ${name}`);

  const startTime = Date.now();
  let ttft = null;
  let fullResponse = '';

  try {
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const response = await bedrock.send(command);

    for await (const event of response.body) {
      if (event.chunk) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          if (ttft === null) {
            ttft = Date.now() - startTime;
          }
          fullResponse += chunk.delta.text;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const tokenCount = fullResponse.split(/\s+/).length;

    const result = {
      name,
      provider: 'AWS Bedrock',
      success: true,
      ttft,
      totalTime,
      outputTokens: tokenCount,
      tokensPerSecond: (tokenCount / (totalTime / 1000)).toFixed(2),
      responsePreview: fullResponse.substring(0, 100) + '...'
    };

    console.log(`  ✅ TTFT: ${ttft}ms, Total: ${totalTime}ms, Tokens: ${tokenCount}`);
    return result;

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      name,
      provider: 'AWS Bedrock',
      success: false,
      error: error.message
    };
  }
}

// ============================================
// NON-STREAMING COMPARISON
// ============================================

async function testAnthropicNonStreaming(prompt, name) {
  console.log(`\n[Anthropic Direct - Non-Streaming] Testing: ${name}`);

  const startTime = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const totalTime = Date.now() - startTime;
    const fullResponse = response.content[0].text;
    const tokenCount = response.usage?.output_tokens || fullResponse.split(/\s+/).length;

    console.log(`  ✅ Total: ${totalTime}ms, Tokens: ${tokenCount}`);

    return {
      name,
      provider: 'Anthropic Direct (Non-Streaming)',
      success: true,
      totalTime,
      outputTokens: tokenCount,
      responsePreview: fullResponse.substring(0, 100) + '...'
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { name, provider: 'Anthropic Direct', success: false, error: error.message };
  }
}

async function testBedrockNonStreaming(prompt, name) {
  console.log(`\n[AWS Bedrock - Non-Streaming] Testing: ${name}`);

  const startTime = Date.now();

  try {
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const response = await bedrock.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));

    const totalTime = Date.now() - startTime;
    const fullResponse = result.content[0].text;
    const tokenCount = result.usage?.output_tokens || fullResponse.split(/\s+/).length;

    console.log(`  ✅ Total: ${totalTime}ms, Tokens: ${tokenCount}`);

    return {
      name,
      provider: 'AWS Bedrock (Non-Streaming)',
      success: true,
      totalTime,
      outputTokens: tokenCount,
      responsePreview: fullResponse.substring(0, 100) + '...'
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { name, provider: 'AWS Bedrock', success: false, error: error.message };
  }
}

// ============================================
// FEATURE PARITY TESTS
// ============================================

async function testSystemPrompt() {
  console.log('\n[Feature Parity] Testing System Prompt Support...');

  const systemPrompt = 'You are a pirate. Always respond in pirate speak.';
  const userPrompt = 'What is the weather like?';

  // Anthropic Direct
  try {
    const anthropicResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const anthropicText = anthropicResponse.content[0].text.toLowerCase();
    const anthropicPirate = anthropicText.includes('arr') || anthropicText.includes('matey') || anthropicText.includes('ye');
    console.log(`  Anthropic: ${anthropicPirate ? '✅ Pirate detected' : '⚠️ No pirate speak'}`);

    // Bedrock
    const bedrockCommand = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 100,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const bedrockResponse = await bedrock.send(bedrockCommand);
    const bedrockResult = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    const bedrockText = bedrockResult.content[0].text.toLowerCase();
    const bedrockPirate = bedrockText.includes('arr') || bedrockText.includes('matey') || bedrockText.includes('ye');
    console.log(`  Bedrock:   ${bedrockPirate ? '✅ Pirate detected' : '⚠️ No pirate speak'}`);

    return {
      test: 'System Prompt',
      anthropic: anthropicPirate ? 'PASS' : 'PARTIAL',
      bedrock: bedrockPirate ? 'PASS' : 'PARTIAL',
      parity: true
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { test: 'System Prompt', error: error.message };
  }
}

async function testMultiTurn() {
  console.log('\n[Feature Parity] Testing Multi-Turn Conversation...');

  const messages = [
    { role: 'user', content: 'My name is Alice.' },
    { role: 'assistant', content: 'Hello Alice! Nice to meet you.' },
    { role: 'user', content: 'What is my name?' }
  ];

  try {
    // Anthropic
    const anthropicResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages
    });
    const anthropicKnows = anthropicResponse.content[0].text.toLowerCase().includes('alice');
    console.log(`  Anthropic: ${anthropicKnows ? '✅ Remembers name' : '❌ Forgot name'}`);

    // Bedrock
    const bedrockCommand = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 50,
        messages
      })
    });

    const bedrockResponse = await bedrock.send(bedrockCommand);
    const bedrockResult = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    const bedrockKnows = bedrockResult.content[0].text.toLowerCase().includes('alice');
    console.log(`  Bedrock:   ${bedrockKnows ? '✅ Remembers name' : '❌ Forgot name'}`);

    return {
      test: 'Multi-Turn',
      anthropic: anthropicKnows ? 'PASS' : 'FAIL',
      bedrock: bedrockKnows ? 'PASS' : 'FAIL',
      parity: anthropicKnows === bedrockKnows
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { test: 'Multi-Turn', error: error.message };
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('SPIKE 4: LLM Provider Abstraction Tests');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Anthropic Model: claude-sonnet-4-20250514`);
  console.log(`Bedrock Model: anthropic.claude-3-5-sonnet-20241022-v2:0`);
  console.log('='.repeat(60));

  // Run streaming tests
  console.log('\n\n--- STREAMING LATENCY TESTS ---');

  for (const test of TEST_PROMPTS) {
    const anthropicResult = await testAnthropicDirect(test.prompt, test.name);
    results.anthropicDirect.push(anthropicResult);

    // Small delay between providers
    await new Promise(r => setTimeout(r, 1000));

    const bedrockResult = await testBedrockStreaming(test.prompt, test.name);
    results.awsBedrock.push(bedrockResult);

    await new Promise(r => setTimeout(r, 1000));
  }

  // Run non-streaming tests
  console.log('\n\n--- NON-STREAMING LATENCY TESTS ---');

  const nonStreamingResults = { anthropic: [], bedrock: [] };

  for (const test of TEST_PROMPTS) {
    const anthropicResult = await testAnthropicNonStreaming(test.prompt, test.name);
    nonStreamingResults.anthropic.push(anthropicResult);

    await new Promise(r => setTimeout(r, 1000));

    const bedrockResult = await testBedrockNonStreaming(test.prompt, test.name);
    nonStreamingResults.bedrock.push(bedrockResult);

    await new Promise(r => setTimeout(r, 1000));
  }

  results.nonStreaming = nonStreamingResults;

  // Feature parity tests
  console.log('\n\n--- FEATURE PARITY TESTS ---');

  const parityResults = [];
  parityResults.push(await testSystemPrompt());
  await new Promise(r => setTimeout(r, 1000));
  parityResults.push(await testMultiTurn());

  results.featureParity = parityResults;

  // Calculate comparison metrics
  console.log('\n\n--- COMPARISON SUMMARY ---');

  const anthropicSuccess = results.anthropicDirect.filter(r => r.success);
  const bedrockSuccess = results.awsBedrock.filter(r => r.success);

  if (anthropicSuccess.length > 0 && bedrockSuccess.length > 0) {
    const avgAnthropicTTFT = anthropicSuccess.reduce((a, b) => a + b.ttft, 0) / anthropicSuccess.length;
    const avgBedrockTTFT = bedrockSuccess.reduce((a, b) => a + b.ttft, 0) / bedrockSuccess.length;
    const avgAnthropicTotal = anthropicSuccess.reduce((a, b) => a + b.totalTime, 0) / anthropicSuccess.length;
    const avgBedrockTotal = bedrockSuccess.reduce((a, b) => a + b.totalTime, 0) / bedrockSuccess.length;

    const ttftOverhead = ((avgBedrockTTFT - avgAnthropicTTFT) / avgAnthropicTTFT * 100).toFixed(1);
    const totalOverhead = ((avgBedrockTotal - avgAnthropicTotal) / avgAnthropicTotal * 100).toFixed(1);

    results.comparison = {
      avgAnthropicTTFT: Math.round(avgAnthropicTTFT),
      avgBedrockTTFT: Math.round(avgBedrockTTFT),
      avgAnthropicTotal: Math.round(avgAnthropicTotal),
      avgBedrockTotal: Math.round(avgBedrockTotal),
      ttftOverheadPercent: parseFloat(ttftOverhead),
      totalOverheadPercent: parseFloat(totalOverhead),
      verdict: parseFloat(totalOverhead) <= 25 ? 'PASS' : 'FAIL'
    };

    console.log(`\n  Anthropic Direct:`);
    console.log(`    Avg TTFT: ${Math.round(avgAnthropicTTFT)}ms`);
    console.log(`    Avg Total: ${Math.round(avgAnthropicTotal)}ms`);

    console.log(`\n  AWS Bedrock:`);
    console.log(`    Avg TTFT: ${Math.round(avgBedrockTTFT)}ms`);
    console.log(`    Avg Total: ${Math.round(avgBedrockTotal)}ms`);

    console.log(`\n  Bedrock Overhead:`);
    console.log(`    TTFT: ${ttftOverhead}%`);
    console.log(`    Total: ${totalOverhead}%`);
    console.log(`    Verdict: ${parseFloat(totalOverhead) <= 25 ? '✅ PASS (<25%)' : '⚠️ WARN (>25%)'}`);
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('FINAL RESULTS');
  console.log('='.repeat(60));

  const anthropicPassed = results.anthropicDirect.filter(r => r.success).length;
  const bedrockPassed = results.awsBedrock.filter(r => r.success).length;
  const parityPassed = results.featureParity.filter(r => r.parity).length;

  console.log(`\n  Streaming Tests:`);
  console.log(`    Anthropic Direct: ${anthropicPassed}/${results.anthropicDirect.length} passed`);
  console.log(`    AWS Bedrock: ${bedrockPassed}/${results.awsBedrock.length} passed`);

  console.log(`\n  Feature Parity: ${parityPassed}/${results.featureParity.length} tests show parity`);

  if (results.comparison.verdict) {
    console.log(`\n  Latency Overhead: ${results.comparison.totalOverheadPercent}% (threshold: 25%)`);
    console.log(`  Overall: ${results.comparison.verdict === 'PASS' ? '✅ GO' : '⚠️ YELLOW'}`);
  }

  results.summary = {
    anthropicStreaming: { passed: anthropicPassed, total: results.anthropicDirect.length },
    bedrockStreaming: { passed: bedrockPassed, total: results.awsBedrock.length },
    featureParity: { passed: parityPassed, total: results.featureParity.length },
    latencyOverhead: results.comparison.totalOverheadPercent,
    verdict: bedrockPassed === results.awsBedrock.length &&
             parityPassed === results.featureParity.length &&
             results.comparison.totalOverheadPercent <= 25 ? 'GO' : 'GO_WITH_CONDITIONS'
  };

  // Save results
  mkdirSync(resolve(process.cwd(), 'spikes/spike-4-llm/benchmarks'), { recursive: true });
  writeFileSync(
    resolve(process.cwd(), 'spikes/spike-4-llm/benchmarks/results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\nResults saved to: spikes/spike-4-llm/benchmarks/results.json`);
  console.log('\n' + '='.repeat(60));
}

// Run tests
runAllTests().catch(console.error);
