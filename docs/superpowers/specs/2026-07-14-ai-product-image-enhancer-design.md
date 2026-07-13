# AI Product Image Enhancer — Design

**Date:** 2026-07-14
**Status:** Draft

## Overview

An AI-powered one-click image enhancer integrated into the admin product form. When an admin uploads a raw product photo, the AI transforms it into a professional studio-quality product shot using image-to-image generation via Hugging Face Inference API (FLUX.1-schnell).

## Architecture

```
Admin ProductForm (src/app/admin/products/ProductForm.tsx)
  ↓  file upload + "Enhance with AI" click
POST /api/admin/products/enhance-image
  ↓
enhanceImage() service (src/lib/enhance-image.ts)
  ├── Auto-builds prompt from product type + name
  ├── Calls Hugging Face Inference API (img2img)
  ├── Saves enhanced image to public/products/enhanced/
  └── Returns enhanced image URL
  ↓
Admin ProductForm shows before/after preview
  ↓  Accept
imageUrl is set to enhanced URL
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/admin/products/enhance-image/route.ts` | API endpoint — accepts image + optional prompt + product type |
| `src/lib/enhance-image.ts` | Core service — Hugging Face call, image save, prompt builder |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/admin/products/ProductForm.tsx` | Replace text image URL input with file upload, enhance button, before/after preview, product type dropdown |

## Data Flow

### Request
```
POST /api/admin/products/enhance-image
Content-Type: multipart/form-data

Fields:
  - image: File          (required — the raw product photo)
  - productName: string  (required — for auto-prompt)
  - productType: string  (optional — ring | necklace | bracelet | earrings | other)
  - customPrompt: string (optional — overrides auto-prompt if provided)
```

### Response (success)
```json
{
  "enhancedUrl": "/products/enhanced/abc123.jpg",
  "originalUrl": "/products/enhanced/abc123-original.jpg"
}
```

### Response (error)
```json
{
  "error": "Failed to enhance image",
  "details": "Hugging Face API error: ..."
}
```

## Hugging Face Integration

**Model:** `black-forest-labs/FLUX.1-schnell` (img2img)

**API call:**
```
POST https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell
Headers:
  Authorization: Bearer ${HF_API_KEY}
  Content-Type: application/json
Body:
{
  "inputs": "<base64 image data>",
  "parameters": {
    "prompt": "<auto-built or custom prompt>",
    "strength": 0.85,
    "guidance_scale": 7.5
  }
}
```

**Response:** Raw image buffer (JPEG/PNG)

## Auto-Prompt Templates

| Product Type | Prompt suffix |
|-------------|---------------|
| ring | `"... on a white marble surface with soft studio lighting, jewelry macro photography, 8K"` |
| necklace | `"... on a velvet display bust with soft studio lighting, jewelry photography, 8K"` |
| bracelet | `"... on a clean white surface with natural lighting, jewelry photography, 8K"` |
| earrings | `"... on a minimalist display stand with soft studio lighting, jewelry photography, 8K"` |
| other | `"... professional studio lighting, clean background, commercial product photography, 8K"` |

Full prompt: `"Professional product photography of a {productName},{promptSuffix}"`

## Storage

- Original and enhanced images saved to `public/products/enhanced/`
- Filename: `{cuid-or-timestamp}.jpg` (original saved as `{id}-original.jpg`)
- Uses `sharp` (already installed) to resize/optimize before saving

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HF_API_KEY` | Yes | Free Hugging Face API token from huggingface.co/settings/tokens |

## Error Handling

- **API failure** → Return 502 with error message
- **Invalid file** → Return 400 (not an image, too large)
- **Timeout** → Return 504 (Hugging Face free tier can be slow on cold start)
- **Save failure** → Return 500

## UI Preview

The admin product form will show a side-by-side before/after comparison after processing:

```
┌─────────────────────────────┐
│  Product Type: [Ring    ▼] │
│                             │
│  ┌───────────────────────┐  │
│  │  Drop image here      │  │
│  │  or click to upload   │  │
│  └───────────────────────┘  │
│                             │
│  Custom prompt (optional):  │
│  [........................] │
│                             │
│  [🔮 Enhance with AI]       │
│                             │
│  ┌──────────┐ ┌──────────┐ │
│  │ Original │ │Enhanced  │ │
│  │  photo   │ │  result  │ │
│  └──────────┘ └──────────┘ │
│       [Retry]  [Accept]    │
└─────────────────────────────┘
```
