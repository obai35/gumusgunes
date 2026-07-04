# SEO & Metadata Design

## Overview

Add comprehensive SEO optimization to the Gümüş Güneş e-commerce site: page-specific metadata, JSON-LD structured data, Open Graph / Twitter Card tags, dynamic sitemap, and robots.txt.

## Sections

### 1. Page-Specific Metadata

Add `generateMetadata()` to all public pages. Each page overrides the root layout's global defaults with page-specific content.

| Page | Dynamic Fields | Title Pattern |
|------|---------------|---------------|
| `/` | - | "Gümüş Güneş — Silver Sun Accessories | Handcrafted Stainless Steel" |
| `/products` | Optional category slug | "{Category Name} — Gümüş Güneş" or "All Collections — Gümüş Güneş" |
| `/products/[id]` | name, description, imageUrl | "{Product Name} — Gümüş Güneş" |
| `/cart` | - | "Shopping Cart — Gümüş Güneş" |
| `/checkout` | - | "Checkout — Gümüş Güneş" |
| `/login` | - | "Login — Gümüş Güneş" |
| `/register` | - | "Create Account — Gümüş Güneş" |
| `/account` | - | "My Account — Gümüş Güneş" |
| `/account/security` | - | "Security Settings — Gümüş Güneş" |
| `/admin/*` | - | "Admin — {Page Name} — Gümüş Güneş" |

Product detail metadata includes `openGraph.images` with the product image (1200x1200).

### 2. JSON-LD Structured Data

Four schema.org types added as `<script type="application/ld+json">`:

**Organization** (root layout)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Gümüş Güneş",
  "url": "https://gumusgunes.com",
  "logo": "https://gumusgunes.com/gumusgunes-logo.jpeg",
  "sameAs": ["https://instagram.com/gumusgunes", "https://facebook.com/gumusgunes"]
}
```

**WebSite** (root layout)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://gumusgunes.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://gumusgunes.com/products?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Product + AggregateRating** (product detail page)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "<product.name>",
  "description": "<product.description>",
  "image": "<product.imageUrl>",
  "brand": { "@type": "Brand", "name": "Gümüş Güneş" },
  "offers": {
    "@type": "Offer",
    "price": "<product.price>",
    "priceCurrency": "EGP",
    "availability": "<product.stock > 0 ? 'InStock' : 'OutOfStock'>"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "<product.rating>",
    "reviewCount": "<product.reviewCount>"
  }
}
```

**BreadcrumbList** (products listing + product detail)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gumusgunes.com" },
    { "@type": "ListItem", "position": 2, "name": "<category>", "item": "https://gumusgunes.com/products" }
  ]
}
```

### 3. Open Graph & Twitter Cards

Extend root layout metadata:
- `metadataBase: new URL('https://gumusgunes.com')`
- `twitter: { card: 'summary_large_image', site: '@gumusgunes' }`

Product detail page overrides:
- `openGraph.title` = product name
- `openGraph.description` = truncated product description (max 160 chars)
- `openGraph.images` = [{ url: product.imageUrl, width: 1200, height: 1200 }]
- `openGraph.type` = 'product'

### 4. Sitemap

`src/app/sitemap.ts` — generates XML sitemap dynamically:

```
GET /sitemap.xml
```

Includes:
- Static pages: `/`, `/cart`, `/checkout`, `/login`, `/register`
- All active products: `/products/[slug]` with `lastModified` from `updatedAt`
- All visible categories: `/products?category=[slug]`

### 5. Robots

`src/app/robots.ts` — generates robots.txt:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /pos
Disallow: /preview

Sitemap: https://gumusgunes.com/sitemap.xml
```

## Implementation Order

1. Sitemap + robots (no dependencies)
2. Page metadata (needs to verify existing layout structure)
3. JSON-LD components (depends on metadata structure)
4. OG/Twitter extensions (part of metadata, done together)
