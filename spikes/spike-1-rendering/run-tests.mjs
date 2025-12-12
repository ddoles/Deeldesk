/**
 * Spike 1: Rendering Engine Tests
 *
 * Tests pptxgenjs with complex layouts to validate:
 * - 8 core slide layouts render correctly
 * - Unicode characters (€, ¥, 日本語) display properly
 * - 25+ item quote tables render with correct math
 * - Text overflow handling
 * - Complex table structures
 */

import PptxGenJS from 'pptxgenjs';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(process.cwd(), 'spikes/spike-1-rendering/outputs');
const RESULTS_FILE = resolve(process.cwd(), 'spikes/spike-1-rendering/results.json');

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, warnings: 0 }
};

function logTest(name, status, details = {}) {
  const result = { name, status, ...details };
  results.tests.push(result);

  const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${name}`);
  if (details.error) console.log(`   Error: ${details.error}`);
  if (details.notes) console.log(`   Notes: ${details.notes}`);

  if (status === 'pass') results.summary.passed++;
  else if (status === 'warn') results.summary.warnings++;
  else results.summary.failed++;
}

// ============================================================================
// TEST 1: Title Slide
// ============================================================================
async function testTitleSlide() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('Deeldesk Proposal', {
      x: 0.5, y: 2, w: '90%', h: 1.5,
      fontSize: 44, bold: true, color: '2563EB',
      align: 'center'
    });
    slide.addText('AI-Powered Sales Proposals', {
      x: 0.5, y: 3.5, w: '90%', h: 0.75,
      fontSize: 24, color: '64748B',
      align: 'center'
    });
    slide.addText('Prepared for: Acme Corporation', {
      x: 0.5, y: 4.5, w: '90%', h: 0.5,
      fontSize: 18, color: '94A3B8',
      align: 'center'
    });

    const filename = '01-title-slide.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Title Slide', 'pass', { file: filename });
  } catch (error) {
    logTest('Title Slide', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 2: Executive Summary (Multi-paragraph text)
// ============================================================================
async function testExecutiveSummary() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('Executive Summary', {
      x: 0.5, y: 0.3, w: '90%', h: 0.6,
      fontSize: 28, bold: true, color: '1E293B'
    });

    const summaryText = `Deeldesk.ai transforms how sales teams create proposals. Our AI-powered platform reduces proposal creation time from hours to minutes while maintaining brand consistency and strategic alignment.

Key benefits include:
• 10x faster proposal generation
• Zero cold start - immediate value for individual sellers
• Automatic capture of positioning, pricing, and solutioning decisions
• Enterprise-grade security with data sovereignty options

This proposal outlines our recommended implementation approach and investment options for Acme Corporation.`;

    slide.addText(summaryText, {
      x: 0.5, y: 1.1, w: '90%', h: 4,
      fontSize: 14, color: '475569',
      valign: 'top', paraSpaceAfter: 12
    });

    const filename = '02-executive-summary.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Executive Summary', 'pass', { file: filename });
  } catch (error) {
    logTest('Executive Summary', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 3: Solution Overview (Bullet points)
// ============================================================================
async function testSolutionOverview() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('Proposed Solution', {
      x: 0.5, y: 0.3, w: '90%', h: 0.6,
      fontSize: 28, bold: true, color: '1E293B'
    });

    const bullets = [
      { text: 'AI Proposal Generation Engine', options: { bullet: true, indentLevel: 0 } },
      { text: 'Natural language to professional slides in <60 seconds', options: { bullet: true, indentLevel: 1, fontSize: 12 } },
      { text: 'Brand-compliant output every time', options: { bullet: true, indentLevel: 1, fontSize: 12 } },
      { text: 'Knowledge Base Integration', options: { bullet: true, indentLevel: 0 } },
      { text: 'Product catalog with pricing rules', options: { bullet: true, indentLevel: 1, fontSize: 12 } },
      { text: 'Competitive battlecards', options: { bullet: true, indentLevel: 1, fontSize: 12 } },
      { text: 'Sales playbooks and objection handling', options: { bullet: true, indentLevel: 1, fontSize: 12 } },
      { text: 'Strategy Capture & Analytics', options: { bullet: true, indentLevel: 0 } },
      { text: 'Automatic extraction of PPS decisions', options: { bullet: true, indentLevel: 1, fontSize: 12 } },
      { text: 'Win/loss pattern analysis', options: { bullet: true, indentLevel: 1, fontSize: 12 } },
    ];

    slide.addText(bullets, {
      x: 0.5, y: 1.1, w: '90%', h: 4,
      fontSize: 16, color: '334155',
      valign: 'top'
    });

    const filename = '03-solution-overview.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Solution Overview (Bullets)', 'pass', { file: filename });
  } catch (error) {
    logTest('Solution Overview (Bullets)', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 4: Simple Pricing Table (5 rows)
// ============================================================================
async function testSimplePricingTable() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('Investment Summary', {
      x: 0.5, y: 0.3, w: '90%', h: 0.6,
      fontSize: 28, bold: true, color: '1E293B'
    });

    const tableData = [
      [
        { text: 'Item', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Qty', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Unit Price', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Total', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } }
      ],
      ['Pro License (Annual)', '25', '$1,200', '$30,000'],
      ['Implementation Services', '1', '$15,000', '$15,000'],
      ['Training Package', '1', '$5,000', '$5,000'],
      ['Premium Support (Year 1)', '1', '$7,500', '$7,500'],
      [
        { text: 'Total Investment', options: { bold: true } },
        '', '',
        { text: '$57,500', options: { bold: true, color: '2563EB' } }
      ]
    ];

    slide.addTable(tableData, {
      x: 0.5, y: 1.2, w: 9, h: 3,
      fontSize: 12,
      border: { pt: 0.5, color: 'E2E8F0' },
      colW: [4, 1, 2, 2]
    });

    const filename = '04-simple-pricing.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Simple Pricing Table', 'pass', { file: filename });
  } catch (error) {
    logTest('Simple Pricing Table', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 5: Complex Quote Table (25+ rows) - STRESS TEST
// ============================================================================
async function testComplexQuoteTable() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('Detailed Quote', {
      x: 0.5, y: 0.2, w: '90%', h: 0.4,
      fontSize: 24, bold: true, color: '1E293B'
    });

    // Generate 25 line items
    const lineItems = [];
    const categories = ['Software', 'Services', 'Support', 'Add-ons'];
    let subtotal = 0;

    // Header row
    lineItems.push([
      { text: 'SKU', options: { bold: true, fill: '1E40AF', color: 'FFFFFF', fontSize: 9 } },
      { text: 'Description', options: { bold: true, fill: '1E40AF', color: 'FFFFFF', fontSize: 9 } },
      { text: 'Category', options: { bold: true, fill: '1E40AF', color: 'FFFFFF', fontSize: 9 } },
      { text: 'Qty', options: { bold: true, fill: '1E40AF', color: 'FFFFFF', fontSize: 9 } },
      { text: 'Unit', options: { bold: true, fill: '1E40AF', color: 'FFFFFF', fontSize: 9 } },
      { text: 'Total', options: { bold: true, fill: '1E40AF', color: 'FFFFFF', fontSize: 9 } }
    ]);

    for (let i = 1; i <= 25; i++) {
      const qty = Math.floor(Math.random() * 50) + 1;
      const unitPrice = Math.floor(Math.random() * 5000) + 100;
      const total = qty * unitPrice;
      subtotal += total;

      const category = categories[Math.floor(Math.random() * categories.length)];
      const fill = i % 2 === 0 ? 'F8FAFC' : 'FFFFFF';

      lineItems.push([
        { text: `SKU-${String(i).padStart(4, '0')}`, options: { fontSize: 8, fill } },
        { text: `Product or Service Item ${i}`, options: { fontSize: 8, fill } },
        { text: category, options: { fontSize: 8, fill } },
        { text: qty.toString(), options: { fontSize: 8, fill, align: 'right' } },
        { text: `$${unitPrice.toLocaleString()}`, options: { fontSize: 8, fill, align: 'right' } },
        { text: `$${total.toLocaleString()}`, options: { fontSize: 8, fill, align: 'right' } }
      ]);
    }

    // Subtotal, tax, total rows
    const tax = Math.round(subtotal * 0.08);
    const grandTotal = subtotal + tax;

    lineItems.push([
      '', '', '', '',
      { text: 'Subtotal:', options: { bold: true, fontSize: 9 } },
      { text: `$${subtotal.toLocaleString()}`, options: { bold: true, fontSize: 9, align: 'right' } }
    ]);
    lineItems.push([
      '', '', '', '',
      { text: 'Tax (8%):', options: { fontSize: 9 } },
      { text: `$${tax.toLocaleString()}`, options: { fontSize: 9, align: 'right' } }
    ]);
    lineItems.push([
      '', '', '', '',
      { text: 'TOTAL:', options: { bold: true, fontSize: 10, fill: '2563EB', color: 'FFFFFF' } },
      { text: `$${grandTotal.toLocaleString()}`, options: { bold: true, fontSize: 10, fill: '2563EB', color: 'FFFFFF', align: 'right' } }
    ]);

    slide.addTable(lineItems, {
      x: 0.3, y: 0.7, w: 9.4, h: 4.5,
      fontSize: 8,
      border: { pt: 0.25, color: 'CBD5E1' },
      colW: [1, 3.5, 1.2, 0.7, 1, 1]
    });

    const filename = '05-complex-quote-25-items.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Complex Quote Table (25 items)', 'pass', {
      file: filename,
      notes: `Generated ${lineItems.length - 1} rows, Grand Total: $${grandTotal.toLocaleString()}`
    });
  } catch (error) {
    logTest('Complex Quote Table (25 items)', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 6: Unicode Characters - CRITICAL TEST
// ============================================================================
async function testUnicodeCharacters() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('International Pricing', {
      x: 0.5, y: 0.3, w: '90%', h: 0.6,
      fontSize: 28, bold: true, color: '1E293B'
    });

    const tableData = [
      [
        { text: 'Region', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Currency', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Price', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Notes', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } }
      ],
      ['United States', 'USD ($)', '$1,500.00', 'Base price'],
      ['European Union', 'EUR (€)', '€1,350.00', 'VAT excluded'],
      ['United Kingdom', 'GBP (£)', '£1,200.00', 'VAT excluded'],
      ['Japan', 'JPY (¥)', '¥165,000', '日本語サポート込み'],
      ['China', 'CNY (¥)', '¥9,800', '中文支持'],
      ['South Korea', 'KRW (₩)', '₩1,650,000', '한국어 지원'],
      ['India', 'INR (₹)', '₹125,000', 'GST excluded'],
      ['Brazil', 'BRL (R$)', 'R$7,500', 'Impostos não incluídos'],
    ];

    slide.addTable(tableData, {
      x: 0.5, y: 1.1, w: 9, h: 3.5,
      fontSize: 12,
      border: { pt: 0.5, color: 'E2E8F0' },
      colW: [2, 1.5, 2, 3.5]
    });

    // Additional Unicode test
    slide.addText('ROI: 50% ↑ | Costs: 30% ↓ | Efficiency: ∞', {
      x: 0.5, y: 4.8, w: '90%', h: 0.4,
      fontSize: 14, color: '059669', align: 'center'
    });

    const filename = '06-unicode-characters.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Unicode Characters (€, ¥, £, ₹, ₩, 日本語, 中文, 한국어)', 'pass', { file: filename });
  } catch (error) {
    logTest('Unicode Characters', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 7: Text Overflow / Long Content
// ============================================================================
async function testTextOverflow() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('Terms & Conditions', {
      x: 0.5, y: 0.3, w: '90%', h: 0.5,
      fontSize: 24, bold: true, color: '1E293B'
    });

    const longText = `This agreement ("Agreement") is entered into as of the Effective Date by and between Deeldesk Inc., a Delaware corporation ("Provider"), and the entity identified in the Order Form ("Customer"). This Agreement governs Customer's access to and use of the Provider's AI-powered proposal generation platform and related services (collectively, the "Services").

1. DEFINITIONS
"Authorized Users" means Customer's employees, contractors, and agents who are authorized by Customer to access and use the Services.
"Customer Data" means all data, content, and information submitted by or on behalf of Customer to the Services, including but not limited to proposals, pricing information, competitive intelligence, and customer information.
"Documentation" means the user guides, help files, and other technical documentation provided by Provider for the Services.

2. LICENSE GRANT
Subject to the terms of this Agreement and payment of applicable fees, Provider grants Customer a non-exclusive, non-transferable license to access and use the Services during the Subscription Term solely for Customer's internal business purposes.

3. RESTRICTIONS
Customer shall not: (a) sublicense, sell, or transfer the Services to any third party; (b) modify, adapt, or create derivative works based on the Services; (c) reverse engineer, disassemble, or decompile the Services; (d) use the Services in violation of applicable laws or regulations.

4. DATA PRIVACY AND SECURITY
Provider maintains industry-standard security measures to protect Customer Data. Customer retains all right, title, and interest in Customer Data. Provider will process Customer Data only as necessary to provide the Services and in accordance with Provider's Privacy Policy.`;

    slide.addText(longText, {
      x: 0.5, y: 0.9, w: 9, h: 4.2,
      fontSize: 9, color: '475569',
      valign: 'top'
    });

    const filename = '07-text-overflow.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Text Overflow / Long Content', 'pass', {
      file: filename,
      notes: 'Long legal text - verify no truncation in output'
    });
  } catch (error) {
    logTest('Text Overflow / Long Content', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 8: Two-Column Layout
// ============================================================================
async function testTwoColumnLayout() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('Why Deeldesk?', {
      x: 0.5, y: 0.3, w: '90%', h: 0.5,
      fontSize: 28, bold: true, color: '1E293B'
    });

    // Left column - Current State
    slide.addText('Current State', {
      x: 0.5, y: 1, w: 4.2, h: 0.4,
      fontSize: 18, bold: true, color: 'DC2626'
    });

    const leftBullets = [
      { text: '4-6 hours per proposal', options: { bullet: true } },
      { text: 'Inconsistent branding', options: { bullet: true } },
      { text: 'Pricing errors common', options: { bullet: true } },
      { text: 'No strategy capture', options: { bullet: true } },
      { text: 'Knowledge silos', options: { bullet: true } },
    ];

    slide.addText(leftBullets, {
      x: 0.5, y: 1.5, w: 4.2, h: 3,
      fontSize: 14, color: '64748B'
    });

    // Right column - With Deeldesk
    slide.addText('With Deeldesk', {
      x: 5.2, y: 1, w: 4.2, h: 0.4,
      fontSize: 18, bold: true, color: '059669'
    });

    const rightBullets = [
      { text: '<10 minutes per proposal', options: { bullet: true } },
      { text: 'Brand compliance built-in', options: { bullet: true } },
      { text: 'Pricing engine with guardrails', options: { bullet: true } },
      { text: 'Automatic PPS capture', options: { bullet: true } },
      { text: 'Centralized knowledge base', options: { bullet: true } },
    ];

    slide.addText(rightBullets, {
      x: 5.2, y: 1.5, w: 4.2, h: 3,
      fontSize: 14, color: '334155'
    });

    const filename = '08-two-column-layout.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Two-Column Layout', 'pass', { file: filename });
  } catch (error) {
    logTest('Two-Column Layout', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 9: Table with Merged Cells
// ============================================================================
async function testMergedCells() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addText('Implementation Timeline', {
      x: 0.5, y: 0.3, w: '90%', h: 0.5,
      fontSize: 28, bold: true, color: '1E293B'
    });

    const tableData = [
      [
        { text: 'Phase', options: { bold: true, fill: '2563EB', color: 'FFFFFF', rowspan: 2 } },
        { text: 'Week 1-2', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Week 3-4', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Week 5-6', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Week 7-8', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } }
      ],
      [
        { text: '' },
        { text: 'Setup', options: { fontSize: 10, fill: 'DBEAFE' } },
        { text: 'Configure', options: { fontSize: 10, fill: 'DBEAFE' } },
        { text: 'Train', options: { fontSize: 10, fill: 'DBEAFE' } },
        { text: 'Go-Live', options: { fontSize: 10, fill: 'DBEAFE' } }
      ],
      [
        { text: 'Platform Setup', options: { bold: true } },
        { text: '●', options: { align: 'center', color: '2563EB' } },
        { text: '●', options: { align: 'center', color: '2563EB' } },
        '', ''
      ],
      [
        { text: 'Knowledge Base', options: { bold: true } },
        '',
        { text: '●', options: { align: 'center', color: '2563EB' } },
        { text: '●', options: { align: 'center', color: '2563EB' } },
        ''
      ],
      [
        { text: 'User Training', options: { bold: true } },
        '', '',
        { text: '●', options: { align: 'center', color: '2563EB' } },
        { text: '●', options: { align: 'center', color: '2563EB' } }
      ],
      [
        { text: 'Go-Live Support', options: { bold: true } },
        '', '', '',
        { text: '●', options: { align: 'center', color: '059669' } }
      ]
    ];

    slide.addTable(tableData, {
      x: 0.5, y: 1, w: 9, h: 3.5,
      fontSize: 12,
      border: { pt: 0.5, color: 'E2E8F0' },
      colW: [2.5, 1.5, 1.5, 1.5, 1.5]
    });

    const filename = '09-merged-cells.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Table with Merged Cells', 'warn', {
      file: filename,
      notes: 'pptxgenjs rowspan support is limited - verify output manually'
    });
  } catch (error) {
    logTest('Table with Merged Cells', 'fail', { error: error.message });
  }
}

// ============================================================================
// TEST 10: Full Proposal (Multiple Slides)
// ============================================================================
async function testFullProposal() {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Deeldesk Proposal for Acme Corp';
    pptx.author = 'Deeldesk AI';
    pptx.company = 'Deeldesk Inc.';

    // Slide 1: Title
    let slide = pptx.addSlide();
    slide.addText('Proposal for Acme Corporation', {
      x: 0.5, y: 2, w: '90%', h: 1.5,
      fontSize: 40, bold: true, color: '2563EB', align: 'center'
    });
    slide.addText('Prepared by Deeldesk | December 2025', {
      x: 0.5, y: 4, w: '90%', h: 0.5,
      fontSize: 16, color: '94A3B8', align: 'center'
    });

    // Slide 2: Agenda
    slide = pptx.addSlide();
    slide.addText('Agenda', {
      x: 0.5, y: 0.3, w: '90%', h: 0.6,
      fontSize: 28, bold: true, color: '1E293B'
    });
    const agenda = [
      { text: '1. Executive Summary', options: { bullet: false } },
      { text: '2. Current Challenges', options: { bullet: false } },
      { text: '3. Proposed Solution', options: { bullet: false } },
      { text: '4. Implementation Plan', options: { bullet: false } },
      { text: '5. Investment Summary', options: { bullet: false } },
      { text: '6. Next Steps', options: { bullet: false } },
    ];
    slide.addText(agenda, {
      x: 0.5, y: 1.2, w: '90%', h: 3.5,
      fontSize: 20, color: '475569', paraSpaceAfter: 16
    });

    // Slide 3: Investment
    slide = pptx.addSlide();
    slide.addText('Investment Summary', {
      x: 0.5, y: 0.3, w: '90%', h: 0.6,
      fontSize: 28, bold: true, color: '1E293B'
    });

    const pricing = [
      [
        { text: 'Component', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Description', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } },
        { text: 'Investment', options: { bold: true, fill: '2563EB', color: 'FFFFFF' } }
      ],
      ['Software Licenses', '25 Pro seats × 12 months', '$30,000'],
      ['Implementation', 'Setup, configuration, integration', '$15,000'],
      ['Training', '2-day onsite training program', '$5,000'],
      ['Support', 'Premium support (Year 1)', '$7,500'],
      [
        { text: 'Total Year 1 Investment', options: { bold: true, fill: 'F0FDF4' } },
        { text: '', options: { fill: 'F0FDF4' } },
        { text: '$57,500', options: { bold: true, fill: 'F0FDF4', color: '059669' } }
      ]
    ];

    slide.addTable(pricing, {
      x: 0.5, y: 1.1, w: 9, h: 3,
      fontSize: 14,
      border: { pt: 0.5, color: 'E2E8F0' },
      colW: [3, 4, 2]
    });

    // Slide 4: Next Steps
    slide = pptx.addSlide();
    slide.addText('Next Steps', {
      x: 0.5, y: 0.3, w: '90%', h: 0.6,
      fontSize: 28, bold: true, color: '1E293B'
    });

    const nextSteps = [
      { text: '1. Schedule technical deep-dive (30 min)', options: { bullet: false } },
      { text: '2. Identify pilot team (5-10 users)', options: { bullet: false } },
      { text: '3. Review and sign agreement', options: { bullet: false } },
      { text: '4. Kick off implementation', options: { bullet: false } },
    ];
    slide.addText(nextSteps, {
      x: 0.5, y: 1.2, w: '90%', h: 2.5,
      fontSize: 18, color: '334155', paraSpaceAfter: 20
    });

    slide.addText('Contact: sales@deeldesk.ai | (555) 123-4567', {
      x: 0.5, y: 4.5, w: '90%', h: 0.4,
      fontSize: 14, color: '2563EB', align: 'center'
    });

    const filename = '10-full-proposal-4-slides.pptx';
    await pptx.writeFile({ fileName: resolve(OUTPUT_DIR, filename) });
    logTest('Full Proposal (4 slides)', 'pass', {
      file: filename,
      notes: 'Complete proposal with title, agenda, pricing, next steps'
    });
  } catch (error) {
    logTest('Full Proposal', 'fail', { error: error.message });
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SPIKE 1: Rendering Engine (pptxgenjs) Tests');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Started: ${new Date().toLocaleString()}`);
  console.log('  Output: spikes/spike-1-rendering/outputs/');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await testTitleSlide();
  await testExecutiveSummary();
  await testSolutionOverview();
  await testSimplePricingTable();
  await testComplexQuoteTable();
  await testUnicodeCharacters();
  await testTextOverflow();
  await testTwoColumnLayout();
  await testMergedCells();
  await testFullProposal();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Passed:   ${results.summary.passed}`);
  console.log(`  ⚠️  Warnings: ${results.summary.warnings}`);
  console.log(`  ❌ Failed:   ${results.summary.failed}`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Save results
  writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${RESULTS_FILE}`);
  console.log('Generated files saved to: spikes/spike-1-rendering/outputs/');
  console.log('\n⚠️  MANUAL STEP: Open .pptx files in PowerPoint/LibreOffice to verify rendering');
}

runAllTests().catch(console.error);
