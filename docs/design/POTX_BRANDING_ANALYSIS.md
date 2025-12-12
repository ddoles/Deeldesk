# POTX Template Upload for Corporate Branding
**Version:** 1.0  
**Status:** Feasibility Analysis  
**Last Updated:** December 2025

---

## Overview

Instead of manually configuring brand colors, fonts, and logos, users could upload a `.potx` (PowerPoint template) file that automatically extracts all branding information. This would significantly simplify the onboarding process and ensure brand consistency.

---

## Technical Feasibility

### Difficulty Level: **MODERATE** (3-5 days implementation)

### Why It's Feasible

1. **POTX files are ZIP archives** - Can be extracted with standard libraries
2. **XML-based structure** - Theme and styling info in readable XML
3. **Existing libraries** - Several Node.js libraries can parse PPTX/POTX
4. **pptxgenjs compatibility** - Can map extracted values to pptxgenjs options

### Challenges

1. **pptxgenjs limitation** - Doesn't natively support loading POTX templates
2. **XML parsing complexity** - Need to extract colors, fonts, layouts from XML
3. **Master slide mapping** - Converting PowerPoint layouts to pptxgenjs layouts
4. **Logo extraction** - Finding and extracting embedded images/logos

---

## What Can Be Extracted from POTX

### 1. Theme Colors
```xml
<!-- From theme/theme1.xml -->
<a:clrScheme>
  <a:dk1><a:srgbClr val="1F2937"/></a:dk1>
  <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
  <a:dk2><a:srgbClr val="0033A0"/></a:dk2>
  <a:lt2><a:srgbClr val="F9FAFB"/></a:lt2>
  <a:accent1><a:srgbClr val="00D4C4"/></a:accent1>
  <!-- ... -->
</a:clrScheme>
```

**Extracted:**
- Primary color (dk2)
- Secondary color (lt2)
- Accent color (accent1)
- Background colors
- Text colors

### 2. Fonts
```xml
<!-- From theme/theme1.xml -->
<a:fontScheme>
  <a:majorFont>
    <a:latin typeface="Inter"/>
  </a:majorFont>
  <a:minorFont>
    <a:latin typeface="Inter"/>
  </a:minorFont>
</a:fontScheme>
```

**Extracted:**
- Heading font
- Body font
- Font sizes (from master slides)

### 3. Master Slide Layouts
```xml
<!-- From ppt/slideMasters/slideMaster1.xml -->
<p:sldMaster>
  <p:cSld>
    <p:spTree>
      <!-- Layout definitions -->
    </p:spTree>
  </p:cSld>
</p:sldMaster>
```

**Extracted:**
- Slide layout structures
- Placeholder positions
- Default shapes/styles

### 4. Logos and Images
```xml
<!-- From slide master -->
<p:pic>
  <p:blipFill>
    <a:blip r:embed="rId1"/>
  </p:blipFill>
</p:pic>
```

**Extracted:**
- Logo images (from media folder)
- Background images
- Default graphics

---

## Implementation Approach

### Option 1: Extract and Store (Recommended)

**Process:**
1. User uploads POTX file
2. Extract ZIP contents
3. Parse XML files to extract branding
4. Store extracted values in the dedicated `brand_settings` table
5. Store extracted logo (if any) in S3 (or S3-compatible storage), reference via `brand_settings.logo_url`
6. Use stored values for proposal generation

**Pros:**
- One-time extraction
- Fast proposal generation
- Can edit extracted values
- Works with current pptxgenjs approach

**Cons:**
- Need to map POTX layouts to our layouts
- May not capture all nuances

**Libraries Needed:**
```typescript
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
```

### Option 2: Use POTX as Base Template

**Process:**
1. User uploads POTX file
2. Store POTX file in S3
3. When generating proposal, use POTX as base
4. Modify slides programmatically

**Pros:**
- Preserves exact layouts
- Maintains all styling
- No mapping needed

**Cons:**
- Requires different library (not pptxgenjs)
- More complex slide modification
- Harder to customize content

**Libraries Needed:**
```typescript
import { Officegen } from 'officegen'; // Or similar
// OR use Python script with python-pptx
```

---

## Recommended Implementation (Option 1)

### Step-by-Step Process

#### 1. Upload & Parse (Backend)

```typescript
// lib/branding/potx-parser.ts

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface ExtractedBranding {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: {
    data: Buffer;
    format: 'png' | 'jpg' | 'svg';
  };
  layouts?: {
    // Extracted layout structures
  };
}

export async function parsePOTXFile(
  fileBuffer: Buffer
): Promise<ExtractedBranding> {
  // 1. Extract ZIP
  const zip = await JSZip.loadAsync(fileBuffer);
  
  // 2. Read theme XML
  const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('string');
  const parser = new XMLParser();
  const theme = parser.parse(themeXml);
  
  // 3. Extract colors
  const colors = extractColors(theme);
  
  // 4. Extract fonts
  const fonts = extractFonts(theme);
  
  // 5. Extract logo (from slide master)
  const logo = await extractLogo(zip);
  
  // 6. Extract layouts (optional, for future use)
  const layouts = await extractLayouts(zip);
  
  return {
    colors,
    fonts,
    logo,
    layouts
  };
}

function extractColors(theme: any): ExtractedBranding['colors'] {
  const scheme = theme['a:theme']['a:themeElements']['a:clrScheme'];
  
  return {
    primary: scheme['a:dk2']['a:srgbClr']['@_val'] || '#0033A0',
    secondary: scheme['a:lt2']['a:srgbClr']['@_val'] || '#2c5282',
    accent: scheme['a:accent1']['a:srgbClr']['@_val'] || '#00D4C4',
    background: scheme['a:lt1']['a:srgbClr']['@_val'] || '#FFFFFF',
    text: scheme['a:dk1']['a:srgbClr']['@_val'] || '#111827',
  };
}

function extractFonts(theme: any): ExtractedBranding['fonts'] {
  const fontScheme = theme['a:theme']['a:themeElements']['a:fontScheme'];
  
  return {
    heading: fontScheme['a:majorFont']['a:latin']['@_typeface'] || 'Arial',
    body: fontScheme['a:minorFont']['a:latin']['@_typeface'] || 'Arial',
  };
}

async function extractLogo(zip: JSZip): Promise<ExtractedBranding['logo']> {
  // Read slide master
  const masterXml = await zip.file('ppt/slideMasters/slideMaster1.xml')?.async('string');
  const parser = new XMLParser();
  const master = parser.parse(masterXml);
  
  // Find logo image reference
  const imageRef = findImageReference(master);
  if (!imageRef) return undefined;
  
  // Extract image from media folder
  const imageFile = zip.file(`ppt/media/${imageRef}`);
  if (!imageFile) return undefined;
  
  const imageData = await imageFile.async('nodebuffer');
  const format = imageRef.split('.').pop() as 'png' | 'jpg' | 'svg';
  
  return {
    data: imageData,
    format
  };
}
```

#### 2. Store Extracted Branding

```typescript
// app/api/settings/branding/upload-template/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { parsePOTXFile } from '@/lib/branding/potx-parser';
import { uploadToS3 } from '@/lib/storage/s3';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const formData = await request.formData();
  const file = formData.get('template') as File;
  
  if (!file || !file.name.endsWith('.potx')) {
    return NextResponse.json(
      { error: 'Invalid file. Please upload a .potx template file.' },
      { status: 400 }
    );
  }
  
  // Parse POTX
  const buffer = Buffer.from(await file.arrayBuffer());
  const branding = await parsePOTXFile(buffer);
  
  // Upload logo to S3 (if extracted)
  let logoUrl: string | undefined;
  if (branding.logo) {
    logoUrl = await uploadToS3(
      `organizations/${session.organizationId}/logo.${branding.logo.format}`,
      branding.logo.data
    );
  }
  
  // Upsert into dedicated brand_settings table
  await prisma.brandSettings.upsert({
    where: { organizationId: session.organizationId },
    create: {
      organizationId: session.organizationId,
      primaryColor: branding.colors.primary,
      secondaryColor: branding.colors.secondary,
      accentColor: branding.colors.accent,
      fontHeading: branding.fonts.heading,
      fontBody: branding.fonts.body,
      logoUrl,
      additionalGuidelines: {
        templateSource: 'potx_upload',
        templateUploadedAt: new Date().toISOString(),
      },
    },
    update: {
      primaryColor: branding.colors.primary,
      secondaryColor: branding.colors.secondary,
      accentColor: branding.colors.accent,
      fontHeading: branding.fonts.heading,
      fontBody: branding.fonts.body,
      logoUrl,
      additionalGuidelines: {
        templateSource: 'potx_upload',
        templateUploadedAt: new Date().toISOString(),
      },
    },
  });
  
  return NextResponse.json({
    success: true,
    branding: {
      colors: branding.colors,
      fonts: branding.fonts,
      logoUploaded: !!logoUrl,
    }
  });
}
```

#### 3. Use in Proposal Generation

```typescript
// lib/export/pptx.ts (updated)

import PptxGenJS from 'pptxgenjs';
import { getOrganization } from '@/lib/db/queries';

export async function generatePPTX(
  proposalId: string,
  organizationId: string
): Promise<Buffer> {
  const org = await getOrganization(organizationId);
  const brandSettings = await prisma.brandSettings.findUnique({ where: { organizationId } });
  
  const pptx = new PptxGenJS();
  
  // Apply extracted branding
  pptx.defineLayout({
    name: 'CUSTOM',
    width: 10,
    height: 7.5,
  });
  
  pptx.layout = 'CUSTOM';
  
  // Set theme colors
  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: '#FFFFFF' }, // or a computed background from brand/theme extraction
    objects: [
      {
        // Logo
        image: {
          path: brandSettings?.logoUrl,
          x: 0.5,
          y: 0.2,
          w: 1.5,
          h: 0.5,
        },
      },
    ],
  });
  
  // Set fonts
  pptx.fontFace = {
    body: brandSettings?.fontBody ?? 'Arial',
    heading: brandSettings?.fontHeading ?? 'Arial',
  };
  
  // Generate slides...
  
  return await pptx.write({ outputType: 'nodebuffer' });
}
```

---

## UI/UX Design

### Upload Interface

```
┌─────────────────────────────────────────────────┐
│  Upload Corporate Template                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  Option 1: Upload POTX Template                 │
│  ┌──────────────────────────────────────────┐  │
│  │  [Drag & Drop or Click to Upload]        │  │
│  │  📄 corporate-template.potx              │  │
│  │                                          │  │
│  │  Supported: .potx files only            │  │
│  │  Max size: 10MB                          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Option 2: Manual Configuration                 │
│  [Switch to manual mode]                        │
│                                                  │
│  What will be extracted:                        │
│  ✓ Brand colors (primary, secondary, accent)    │
│  ✓ Fonts (heading, body)                        │
│  ✓ Logo (if present in template)                │
│  ⚠ Layouts (future enhancement)                 │
│                                                  │
│  [Upload Template] [Cancel]                     │
└─────────────────────────────────────────────────┘
```

### Preview After Upload

```
┌─────────────────────────────────────────────────┐
│  Template Uploaded Successfully!                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Extracted Branding:                            │
│  ┌──────────────────────────────────────────┐  │
│  │  Colors:                                  │  │
│  │  Primary:   ████ #0033A0                  │  │
│  │  Secondary: ████ #2c5282                  │  │
│  │  Accent:    ████ #00D4C4                  │  │
│  │                                            │  │
│  │  Fonts:                                    │  │
│  │  Heading: Inter                            │  │
│  │  Body: Inter                               │  │
│  │                                            │  │
│  │  Logo: ✓ Extracted and uploaded           │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Preview:                                       │
│  [Sample proposal slide with branding]          │
│                                                  │
│  [Use This Branding] [Edit Manually]            │
└─────────────────────────────────────────────────┘
```

---

## Implementation Complexity

### Time Estimate

| Task | Complexity | Time |
|------|------------|------|
| POTX parser library setup | Low | 4 hours |
| XML parsing for colors/fonts | Medium | 8 hours |
| Logo extraction | Medium | 6 hours |
| Upload API endpoint | Low | 4 hours |
| UI for upload | Low | 6 hours |
| Integration with pptxgenjs | Medium | 8 hours |
| Testing & edge cases | Medium | 8 hours |
| **Total** | **Moderate** | **44 hours (~5.5 days)** |

### Dependencies

```json
{
  "dependencies": {
    "jszip": "^3.10.1",
    "fast-xml-parser": "^4.3.2",
    "@aws-sdk/client-s3": "^3.0.0" // For logo storage
  }
}
```

---

## Benefits vs Manual Configuration

### Benefits

1. **Faster Onboarding** - Upload template vs manual entry
2. **Brand Accuracy** - Exact colors/fonts from template
3. **Logo Extraction** - Automatic logo detection
4. **Familiar Workflow** - Users already have POTX templates
5. **Consistency** - Matches existing corporate templates

### Limitations

1. **Layout Mapping** - Can't directly use POTX layouts (would need different approach)
2. **Complex Templates** - May not extract all nuances
3. **File Size** - Large templates may be slow to parse
4. **Validation** - Need to handle invalid/corrupted POTX files

---

## Recommendation

### Phase 0: Validate Feasibility (1 day spike)

**Tasks:**
- [ ] Set up POTX parser with sample template
- [ ] Extract colors, fonts, logo from test POTX
- [ ] Map extracted values to pptxgenjs
- [ ] Generate test proposal with extracted branding
- [ ] Document edge cases and limitations

**Go/No-Go Criteria:**
- ✅ Can extract colors, fonts, logo reliably
- ✅ Can map to pptxgenjs successfully
- ✅ Generated proposal matches template branding
- ✅ Performance acceptable (<5s parse time)

### MVP Implementation (Sprint 7 or 8)

**If Phase 0 succeeds:**
- Add POTX upload to Settings → Organization → Branding
- Implement parser and storage
- Add preview functionality
- Keep manual configuration as fallback

**If Phase 0 fails:**
- Stick with manual configuration
- Consider Phase 2 enhancement with different library

---

## Alternative: Hybrid Approach

### Best of Both Worlds

1. **POTX Upload** - Extract colors, fonts, logo automatically
2. **Manual Override** - Allow editing extracted values
3. **Preview** - Show how branding will appear
4. **Validation** - Check extracted values make sense

This gives users the convenience of upload with the flexibility of manual editing.

---

## Conclusion

**Difficulty: MODERATE (3-5 days)**

**Recommendation:**
1. **Phase 0 Spike** - Validate feasibility (1 day)
2. **If successful** - Implement in Sprint 7 (Polish sprint)
3. **Keep manual config** - As fallback option
4. **Future enhancement** - Full layout extraction (Phase 2)

**Key Success Factors:**
- Reliable XML parsing
- Good error handling
- Clear user feedback
- Fallback to manual config

This feature would significantly improve user experience and reduce onboarding friction!

