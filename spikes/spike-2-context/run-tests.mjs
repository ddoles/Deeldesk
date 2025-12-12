/**
 * Spike 2: Context Window Reasoning Tests
 *
 * Tests LLM accuracy for:
 * - "Needle in haystack" fact retrieval (>95% target)
 * - Math integrity (0% drift on exact numbers)
 * - Currency consistency handling
 * - Buried fact extraction from long contexts
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// Load environment
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"'))) value = value.slice(1, -1);
    env[match[1].trim()] = value;
  }
});

const OUTPUT_DIR = resolve(process.cwd(), 'spikes/spike-2-context/results');
const RESULTS_FILE = resolve(OUTPUT_DIR, 'results.json');

mkdirSync(OUTPUT_DIR, { recursive: true });

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    needleTests: { passed: 0, total: 0, accuracy: 0 },
    mathTests: { passed: 0, total: 0, accuracy: 0 },
    currencyTests: { passed: 0, total: 0, accuracy: 0 }
  }
};

// ============================================================================
// TEST DATA: Simulated Battlecard with Buried Facts
// ============================================================================
const BATTLECARD_CONTEXT = `
# Competitive Intelligence: TechCorp Solutions

## Company Overview
TechCorp Solutions is a mid-market enterprise software company founded in 2015, headquartered in Austin, Texas. They primarily serve the healthcare and financial services verticals with their document management platform.

## Product Portfolio
Their main product, DocuFlow Pro, competes directly with our proposal generation capabilities. They also offer DocuFlow Lite for small businesses and DocuFlow Enterprise for large organizations.

### Pricing Structure
- DocuFlow Lite: $29/user/month (annual billing)
- DocuFlow Pro: $79/user/month (annual billing)
- DocuFlow Enterprise: Custom pricing, typically $120-150/user/month

### Key Limitations
1. No AI-powered generation capabilities
2. Limited template customization (only 12 base templates)
3. No real-time collaboration features
4. Export limited to PDF only (no PPTX)
5. Mobile app rated 2.3 stars on App Store

## Win/Loss Analysis

### Recent Wins Against TechCorp
- Acme Healthcare: Won on AI capabilities, $180,000 ACV
- Global Finance Inc: Won on integration depth, $425,000 ACV
- MedTech Partners: Won on pricing (23% lower TCO), $95,000 ACV

### Recent Losses to TechCorp
- Regional Bank Corp: Lost on existing relationship, $150,000 ACV
- HealthFirst Systems: Lost on compliance certifications, $275,000 ACV

## Technical Comparison

| Feature | Deeldesk | TechCorp |
|---------|----------|----------|
| AI Generation | ✅ Yes | ❌ No |
| PPTX Export | ✅ Yes | ❌ No |
| API Access | ✅ Full REST API | ⚠️ Limited |
| SSO Support | ✅ SAML, OIDC | ✅ SAML only |
| Data Residency | ✅ US, EU, APAC | ⚠️ US only |

## Objection Handling

### "TechCorp has better healthcare compliance"
Response: While TechCorp has HIPAA certification, Deeldesk also maintains HIPAA, SOC 2 Type II, and GDPR compliance. Additionally, our data sovereignty options allow healthcare customers to keep data within their preferred cloud region.

### "TechCorp is cheaper"
Response: When comparing total cost of ownership over 3 years, Deeldesk typically provides 23% lower TCO due to reduced manual effort. The average customer saves 4.2 hours per proposal, which at $75/hour loaded cost equals $315 per proposal.

## Key Contacts
- CEO: Sarah Martinez (former VP at Salesforce)
- CTO: James Chen (15 years at Microsoft)
- Head of Sales: Michael Brown (aggressive discounting authorized up to 35%)

## Recent News
- Q3 2025: Announced Series C funding of $45 million at $380 million valuation
- Q2 2025: Launched DocuFlow Analytics module
- Q1 2025: Opened EMEA headquarters in London

## Internal Notes
**CONFIDENTIAL**: Our sources indicate TechCorp is experiencing 18% annual churn in their SMB segment. Their enterprise retention is stronger at 94%. They are rumored to be exploring acquisition targets in the AI space.

The specific discount threshold for TechCorp competitive situations is 15% off list, with VP approval required for anything beyond 20%. Their average deal cycle is 47 days for mid-market and 89 days for enterprise.

Their NPS score dropped from 42 to 31 in the last year, primarily due to support response time issues. Average support ticket resolution is 72 hours, compared to our 4-hour SLA for premium customers.
`;

const PRODUCT_CONTEXT = `
# Product Catalog: Deeldesk Platform

## Core Platform

### Deeldesk Pro
**SKU:** DD-PRO-001
**Description:** AI-powered proposal generation for sales teams
**Pricing:** $99/user/month (annual) or $119/user/month (monthly)
**Minimum Users:** 5
**Features:**
- Unlimited proposal generation
- 50GB storage per user
- Standard integrations (Salesforce, HubSpot)
- Email support (24-hour response)

### Deeldesk Team
**SKU:** DD-TEAM-001
**Description:** Enhanced collaboration and analytics for growing teams
**Pricing:** $149/user/month (annual) or $179/user/month (monthly)
**Minimum Users:** 10
**Features:**
- Everything in Pro
- Advanced analytics dashboard
- Custom branding
- API access (10,000 calls/month)
- Priority support (4-hour response)

### Deeldesk Enterprise
**SKU:** DD-ENT-001
**Description:** Full platform with enterprise controls
**Pricing:** Custom (typically $199-299/user/month)
**Minimum Users:** 50
**Features:**
- Everything in Team
- Unlimited API access
- SSO/SAML integration
- Data residency options (US, EU, APAC)
- Dedicated success manager
- 99.9% SLA
- Premium support (1-hour response)

## Add-On Modules

### Knowledge Base Premium
**SKU:** DD-KB-PREM
**Description:** Advanced knowledge management with AI-powered search
**Pricing:** $2,500/month flat fee
**Requirements:** Team or Enterprise plan

### Analytics Plus
**SKU:** DD-ANALYTICS
**Description:** Advanced win/loss analytics and forecasting
**Pricing:** $1,500/month flat fee
**Requirements:** Team or Enterprise plan

### Compliance Pack
**SKU:** DD-COMPLY
**Description:** Enhanced audit logging and compliance reporting
**Pricing:** $3,000/month flat fee
**Requirements:** Enterprise plan only
**Certifications:** SOC 2 Type II, HIPAA, GDPR, ISO 27001

## Professional Services

### Implementation Package - Standard
**SKU:** DD-IMPL-STD
**Description:** 4-week implementation with configuration and training
**Pricing:** $15,000 one-time
**Includes:**
- Platform configuration
- 2 integrations setup
- Admin training (2 days)
- User training (1 day)
- Go-live support

### Implementation Package - Premium
**SKU:** DD-IMPL-PREM
**Description:** 8-week implementation with custom development
**Pricing:** $45,000 one-time
**Includes:**
- Everything in Standard
- Custom integration development
- Data migration (up to 10,000 records)
- Extended training program
- 30-day hypercare support

### Training Package
**SKU:** DD-TRAIN
**Description:** Additional training sessions
**Pricing:** $2,500 per day
**Format:** On-site or virtual

## Volume Discounts
- 50-99 users: 10% discount
- 100-249 users: 15% discount
- 250-499 users: 20% discount
- 500+ users: 25% discount (requires VP approval)

## Payment Terms
- Annual prepay: Standard pricing
- Quarterly: +5% premium
- Monthly: +10% premium
- Net 30 payment terms for Enterprise customers
`;

// ============================================================================
// NEEDLE IN HAYSTACK TESTS
// ============================================================================
const needleTests = [
  {
    name: 'Exact Price Retrieval',
    context: PRODUCT_CONTEXT,
    question: 'What is the exact monthly price for Deeldesk Pro with annual billing?',
    expectedAnswer: '$99/user/month',
    acceptableAnswers: ['$99', '99', '$99/user/month', '$99 per user per month']
  },
  {
    name: 'Buried Percentage',
    context: BATTLECARD_CONTEXT,
    question: 'What is TechCorp\'s annual churn rate in their SMB segment?',
    expectedAnswer: '18%',
    acceptableAnswers: ['18%', '18 percent', 'eighteen percent']
  },
  {
    name: 'Specific ACV Value',
    context: BATTLECARD_CONTEXT,
    question: 'What was the ACV of the deal won against TechCorp at Global Finance Inc?',
    expectedAnswer: '$425,000',
    acceptableAnswers: ['$425,000', '425000', '$425K', '425,000']
  },
  {
    name: 'Competitor Discount Threshold',
    context: BATTLECARD_CONTEXT,
    question: 'What is the specific discount threshold for TechCorp competitive situations?',
    expectedAnswer: '15%',
    acceptableAnswers: ['15%', '15 percent', 'fifteen percent', '15% off list']
  },
  {
    name: 'Time-based Metric',
    context: BATTLECARD_CONTEXT,
    question: 'What is TechCorp\'s average deal cycle for enterprise customers?',
    expectedAnswer: '89 days',
    acceptableAnswers: ['89 days', '89', 'eighty-nine days']
  },
  {
    name: 'Nested Product Detail',
    context: PRODUCT_CONTEXT,
    question: 'How many API calls per month are included in the Deeldesk Team plan?',
    expectedAnswer: '10,000',
    acceptableAnswers: ['10,000', '10000', '10K', '10,000 calls/month']
  },
  {
    name: 'Multi-hop Fact',
    context: BATTLECARD_CONTEXT,
    question: 'What is the App Store rating for TechCorp\'s mobile app?',
    expectedAnswer: '2.3 stars',
    acceptableAnswers: ['2.3', '2.3 stars', '2.3 star rating']
  },
  {
    name: 'Funding Amount',
    context: BATTLECARD_CONTEXT,
    question: 'How much Series C funding did TechCorp raise and at what valuation?',
    expectedAnswer: '$45 million at $380 million valuation',
    acceptableAnswers: ['$45 million', '45 million', '$380 million', '$45M', '$380M']
  },
  {
    name: 'Support SLA Comparison',
    context: PRODUCT_CONTEXT,
    question: 'What is the support response time SLA for Deeldesk Enterprise premium support?',
    expectedAnswer: '1-hour',
    acceptableAnswers: ['1-hour', '1 hour', 'one hour', '1-hour response']
  },
  {
    name: 'Volume Discount Threshold',
    context: PRODUCT_CONTEXT,
    question: 'What discount percentage is available for 100-249 users?',
    expectedAnswer: '15%',
    acceptableAnswers: ['15%', '15 percent', 'fifteen percent']
  }
];

// ============================================================================
// MATH INTEGRITY TESTS
// ============================================================================
const mathTests = [
  {
    name: 'Simple Multiplication',
    prompt: 'A customer wants 25 Deeldesk Pro licenses at $99/user/month for annual billing. Calculate the exact annual cost. Return ONLY the number, no explanation.',
    expectedAnswer: 29700,
    tolerance: 0 // Must be exact
  },
  {
    name: 'Discount Calculation',
    prompt: 'Base price is $149/user/month for 75 users. Apply a 10% volume discount. What is the monthly cost? Return ONLY the number, no explanation.',
    expectedAnswer: 10057.50,
    tolerance: 0.01
  },
  {
    name: 'Multi-line Quote Total',
    prompt: `Calculate the total for this quote:
- 50 Pro licenses × $99/month × 12 months = ?
- Implementation: $15,000
- Training: $2,500 × 2 days = ?
Total: Return ONLY the final total number, no explanation.`,
    expectedAnswer: 79400,
    tolerance: 0
  },
  {
    name: 'Percentage Savings',
    prompt: 'Customer currently spends $180,000/year. With Deeldesk, they would spend $138,600/year. What is the exact percentage savings? Return ONLY the percentage number (e.g., 23.0), no explanation.',
    expectedAnswer: 23.0,
    tolerance: 0.1
  },
  {
    name: 'Complex TCO Calculation',
    prompt: `Calculate 3-year TCO:
Year 1: $50,000 (licenses) + $15,000 (implementation) = $65,000
Year 2: $50,000 (licenses) + $5,000 (support) = $55,000
Year 3: $50,000 (licenses) + $5,000 (support) = $55,000
What is the total 3-year TCO? Return ONLY the number, no explanation.`,
    expectedAnswer: 175000,
    tolerance: 0
  }
];

// ============================================================================
// CURRENCY CONSISTENCY TESTS
// ============================================================================
const currencyTests = [
  {
    name: 'Mixed Currency Detection',
    prompt: `Review this quote for currency consistency:
- Software: $50,000 USD
- Services: €15,000 EUR
- Training: $5,000 USD

Are all items in the same currency? If not, identify the inconsistency. Answer with "CONSISTENT" or "INCONSISTENT: [explanation]"`,
    expectInconsistent: true
  },
  {
    name: 'All Same Currency',
    prompt: `Review this quote for currency consistency:
- Software: $50,000
- Services: $15,000
- Training: $5,000
- Support: $7,500

Are all items in the same currency? Answer with "CONSISTENT" or "INCONSISTENT: [explanation]"`,
    expectInconsistent: false
  },
  {
    name: 'Subtle Currency Mix',
    prompt: `Review this international quote:
- US Office: $25,000 USD
- EU Office: $18,000 USD
- UK Office: £12,000 GBP

Are all items in the same currency? Answer with "CONSISTENT" or "INCONSISTENT: [explanation]"`,
    expectInconsistent: true
  }
];

// ============================================================================
// TEST RUNNERS
// ============================================================================
async function runNeedleTest(test, iteration) {
  const systemPrompt = `You are a helpful assistant analyzing business documents. Answer questions precisely based ONLY on the provided context. If the exact information is not in the context, say "NOT FOUND".`;

  const userPrompt = `Context:
${test.context}

Question: ${test.question}

Provide a brief, precise answer based only on the context above.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const answer = response.content[0].text.trim();
    const passed = test.acceptableAnswers.some(acceptable =>
      answer.toLowerCase().includes(acceptable.toLowerCase())
    );

    return {
      name: test.name,
      iteration,
      passed,
      expectedAnswer: test.expectedAnswer,
      actualAnswer: answer,
      acceptableAnswers: test.acceptableAnswers
    };
  } catch (error) {
    return {
      name: test.name,
      iteration,
      passed: false,
      error: error.message
    };
  }
}

async function runMathTest(test) {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: test.prompt }]
    });

    const answerText = response.content[0].text.trim();
    const numericAnswer = parseFloat(answerText.replace(/[$,]/g, ''));

    const diff = Math.abs(numericAnswer - test.expectedAnswer);
    const passed = diff <= test.tolerance;

    return {
      name: test.name,
      passed,
      expectedAnswer: test.expectedAnswer,
      actualAnswer: numericAnswer,
      rawAnswer: answerText,
      tolerance: test.tolerance,
      drift: diff
    };
  } catch (error) {
    return {
      name: test.name,
      passed: false,
      error: error.message
    };
  }
}

async function runCurrencyTest(test) {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: test.prompt }]
    });

    const answer = response.content[0].text.trim().toUpperCase();
    const detectedInconsistent = answer.includes('INCONSISTENT');
    const passed = detectedInconsistent === test.expectInconsistent;

    return {
      name: test.name,
      passed,
      expectedInconsistent: test.expectInconsistent,
      detectedInconsistent,
      rawAnswer: response.content[0].text.trim()
    };
  } catch (error) {
    return {
      name: test.name,
      passed: false,
      error: error.message
    };
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SPIKE 2: Context Window Reasoning Tests');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Started: ${new Date().toLocaleString()}`);
  console.log(`  Model: claude-sonnet-4-20250514`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // -------------------------------------------------------------------------
  // Needle in Haystack Tests
  // -------------------------------------------------------------------------
  console.log('📍 NEEDLE IN HAYSTACK TESTS (Target: >95% accuracy)\n');

  const needleResults = [];
  const ITERATIONS = 3; // Run each test 3 times for consistency

  for (const test of needleTests) {
    process.stdout.write(`  Testing: ${test.name}...`);
    const iterResults = [];

    for (let i = 1; i <= ITERATIONS; i++) {
      const result = await runNeedleTest(test, i);
      iterResults.push(result);
      await new Promise(r => setTimeout(r, 500)); // Rate limiting
    }

    const passCount = iterResults.filter(r => r.passed).length;
    const status = passCount === ITERATIONS ? '✅' : passCount > 0 ? '⚠️' : '❌';
    console.log(` ${status} (${passCount}/${ITERATIONS})`);

    needleResults.push({
      test: test.name,
      iterations: iterResults,
      passRate: passCount / ITERATIONS
    });

    results.summary.needleTests.total += ITERATIONS;
    results.summary.needleTests.passed += passCount;
  }

  results.summary.needleTests.accuracy =
    (results.summary.needleTests.passed / results.summary.needleTests.total * 100).toFixed(1);

  console.log(`\n  Needle Tests Accuracy: ${results.summary.needleTests.accuracy}%`);
  console.log(`  (${results.summary.needleTests.passed}/${results.summary.needleTests.total} passed)\n`);

  // -------------------------------------------------------------------------
  // Math Integrity Tests
  // -------------------------------------------------------------------------
  console.log('🔢 MATH INTEGRITY TESTS (Target: 0% drift)\n');

  const mathResults = [];

  for (const test of mathTests) {
    process.stdout.write(`  Testing: ${test.name}...`);
    const result = await runMathTest(test);
    mathResults.push(result);

    const status = result.passed ? '✅' : '❌';
    const driftInfo = result.drift !== undefined ? ` (drift: ${result.drift})` : '';
    console.log(` ${status}${driftInfo}`);

    results.summary.mathTests.total++;
    if (result.passed) results.summary.mathTests.passed++;

    await new Promise(r => setTimeout(r, 500));
  }

  results.summary.mathTests.accuracy =
    (results.summary.mathTests.passed / results.summary.mathTests.total * 100).toFixed(1);

  console.log(`\n  Math Tests Accuracy: ${results.summary.mathTests.accuracy}%`);
  console.log(`  (${results.summary.mathTests.passed}/${results.summary.mathTests.total} passed)\n`);

  // -------------------------------------------------------------------------
  // Currency Consistency Tests
  // -------------------------------------------------------------------------
  console.log('💱 CURRENCY CONSISTENCY TESTS\n');

  const currencyResults = [];

  for (const test of currencyTests) {
    process.stdout.write(`  Testing: ${test.name}...`);
    const result = await runCurrencyTest(test);
    currencyResults.push(result);

    const status = result.passed ? '✅' : '❌';
    console.log(` ${status}`);

    results.summary.currencyTests.total++;
    if (result.passed) results.summary.currencyTests.passed++;

    await new Promise(r => setTimeout(r, 500));
  }

  results.summary.currencyTests.accuracy =
    (results.summary.currencyTests.passed / results.summary.currencyTests.total * 100).toFixed(1);

  console.log(`\n  Currency Tests Accuracy: ${results.summary.currencyTests.accuracy}%`);
  console.log(`  (${results.summary.currencyTests.passed}/${results.summary.currencyTests.total} passed)\n`);

  // -------------------------------------------------------------------------
  // Save Results
  // -------------------------------------------------------------------------
  results.tests = {
    needle: needleResults,
    math: mathResults,
    currency: currencyResults
  };

  writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  📍 Needle in Haystack: ${results.summary.needleTests.accuracy}% ${parseFloat(results.summary.needleTests.accuracy) >= 95 ? '✅ PASS' : '❌ BELOW TARGET'}`);
  console.log(`  🔢 Math Integrity:     ${results.summary.mathTests.accuracy}% ${parseFloat(results.summary.mathTests.accuracy) === 100 ? '✅ PASS' : '❌ DRIFT DETECTED'}`);
  console.log(`  💱 Currency Detection: ${results.summary.currencyTests.accuracy}% ${parseFloat(results.summary.currencyTests.accuracy) === 100 ? '✅ PASS' : '⚠️ REVIEW NEEDED'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\nDetailed results saved to: ${RESULTS_FILE}`);

  const overallPass =
    parseFloat(results.summary.needleTests.accuracy) >= 95 &&
    parseFloat(results.summary.mathTests.accuracy) >= 95;

  if (overallPass) {
    console.log('\n🎉 SPIKE 2 PASSED: Context window reasoning meets requirements!');
  } else {
    console.log('\n⚠️  SPIKE 2 NEEDS ATTENTION: Review failed tests and consider prompt engineering improvements.');
  }
}

runAllTests().catch(console.error);
