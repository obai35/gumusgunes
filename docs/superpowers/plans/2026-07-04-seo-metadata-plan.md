# SEO & Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive SEO — page metadata, JSON-LD structured data, Open Graph, sitemap, robots.txt.

**Architecture:** Server components use `generateMetadata()` directly. Client component pages get wrapper `layout.tsx` files with metadata exports. JSON-LD rendered as `<script>` tags via server components. Sitemap generated dynamically from DB queries.

**Tech Stack:** Next.js Metadata API, schema.org JSON-LD, Next.js sitemap/robots conventions

---

### Task 1: Sitemap + Robots

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Create sitemap.ts**

```typescript
import { db } from '@/lib/db'

const BASE_URL = 'https://gumusgunes.com'

export default async function sitemap() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
    take: 5000,
  })

  const categories = await db.category.findMany({
    where: { isVisible: true },
    select: { slug: true, updatedAt: true },
  })

  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/cart`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${BASE_URL}/checkout`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.1 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.1 },
  ]

  const productPages = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const categoryPages = categories.map((c) => ({
    url: `${BASE_URL}/products?category=${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...productPages, ...categoryPages]
}
```

- [ ] **Create robots.ts**

```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/pos', '/preview'],
      },
    ],
    sitemap: 'https://gumusgunes.com/sitemap.xml',
  }
}
```

- [ ] **Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: add dynamic sitemap and robots.txt"
```

---

### Task 2: Root Layout — Metadata Extensions + Organization JSON-LD

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Extend root metadata with metadataBase, twitter card, and Open Graph**

Replace the `metadata` export with:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://gumusgunes.com'),
  title: {
    default: "Gümüş Güneş — Silver Sun Accessories | Handcrafted Stainless Steel",
    template: "%s — Gümüş Güneş",
  },
  description:
    "Gümüş Güneş (Silver Sun) — handcrafted premium stainless steel accessories. Rings, necklaces, earrings, bracelets and pendants inspired by the sun, moon, and stars.",
  keywords: [
    "Gümüş Güneş",
    "Silver Sun",
    "stainless steel accessories",
    "steel rings",
    "steel necklaces",
    "diamond accessories",
    "Turkish jewelry",
    "luxury accessories",
  ],
  authors: [{ name: "Gümüş Güneş" }],
  icons: {
    icon: "/gumusgunes-logo.jpeg",
  },
  openGraph: {
    title: "Gümüş Güneş — Silver Sun Accessories",
    description: "Handcrafted premium stainless steel accessories inspired by the sun, moon, and stars.",
    siteName: "Gümüş Güneş",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@gumusgunes",
  },
}
```

Note the addition of:
- `metadataBase` — required for OG images to resolve
- `title.template` — so child pages can just set `title: "Page Name"` and it auto-appends "— Gümüş Güneş"
- `twitter` card configuration
- `openGraph.locale`

- [ ] **Add Organization + WebSite JSON-LD to the root body**

Add this before the `{children}`:

```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Gümüş Güneş",
      url: "https://gumusgunes.com",
      logo: "https://gumusgunes.com/gumusgunes-logo.jpeg",
      sameAs: ["https://instagram.com/gumusgunes", "https://facebook.com/gumusgunes"],
    }),
  }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: "https://gumusgunes.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://gumusgunes.com/products?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    }),
  }}
/>
```

- [ ] **Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add metadata extensions, twitter card, and Organization/WebSite JSON-LD"
```

---

### Task 3: Page Metadata — Products Listing

**Files:**
- Modify: `src/app/products/page.tsx`

- [ ] **Add generateMetadata to products page**

Add before the `ProductsPage` function:

```typescript
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "All Collections",
    description: "Explore our handcrafted stainless steel accessories — rings, necklaces, earrings, bracelets, and pendants.",
    openGraph: {
      title: "All Collections — Gümüş Güneş",
      description: "Explore our handcrafted stainless steel accessories.",
    },
  }
}
```

- [ ] **Commit**

```bash
git add src/app/products/page.tsx
git commit -m "feat: add products listing page metadata"
```

---

### Task 4: Page Metadata — Product Detail + JSON-LD

**Files:**
- Modify: `src/app/products/[id]/page.tsx`

- [ ] **Add generateMetadata for product detail**

Add before the `ProductDetailPage` function:

```typescript
import type { Metadata } from 'next'
import { db } from '@/lib/db'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    select: { name: true, description: true, imageUrl: true, price: true },
  })

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [{ url: product.imageUrl, width: 1200, height: 1200 }],
      type: 'product',
    },
  }
}
```

- [ ] **Add Product + Breadcrumb JSON-LD to the page component**

After the Breadcrumb nav and before `<ProductDetailClient ... />`, add:

```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: serialized.product.name,
      description: serialized.product.description,
      image: serialized.product.imageUrl,
      brand: { "@type": "Brand", name: "Gümüş Güneş" },
      offers: {
        "@type": "Offer",
        price: serialized.product.price,
        priceCurrency: "EGP",
        availability: serialized.product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
      aggregateRating: serialized.product.reviewCount > 0 ? {
        "@type": "AggregateRating",
        ratingValue: serialized.product.rating,
        reviewCount: serialized.product.reviewCount,
      } : undefined,
    }),
  }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://gumusgunes.com" },
        { "@type": "ListItem", position: 2, name: "Products", item: "https://gumusgunes.com/products" },
        { "@type": "ListItem", position: 3, name: serialized.product.name },
      ],
    }),
  }}
/>
```

- [ ] **Commit**

```bash
git add 'src/app/products/[id]/page.tsx'
git commit -m "feat: add product detail metadata and JSON-LD structured data"
```

---

### Task 5: Page Metadata — Cart + Checkout

**Files:**
- Modify: `src/app/cart/page.tsx`
- Modify: `src/app/checkout/page.tsx`

- [ ] **Add metadata to cart page**

Add before the default export in `src/app/cart/page.tsx`:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your items and proceed to checkout.",
}
```

- [ ] **Add metadata to checkout page**

Add before the default export in `src/app/checkout/page.tsx`:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order securely.",
}
```

- [ ] **Commit**

```bash
git add src/app/cart/page.tsx src/app/checkout/page.tsx
git commit -m "feat: add cart and checkout page metadata"
```

---

### Task 6: Layout Wrappers for Client-Component Pages

**Files:**
- Create: `src/app/login/layout.tsx`
- Create: `src/app/register/layout.tsx`
- Create: `src/app/account/layout.tsx`
- Create: `src/app/account/security/layout.tsx`

- [ ] **Create login layout**

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Gümüş Güneş account.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Create register layout**

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Gümüş Güneş account for faster checkout and order tracking.",
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Create account layout**

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your profile, orders, and saved addresses.",
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Create account security layout**

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Security Settings",
  description: "Manage your password and security preferences.",
}

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Commit**

```bash
git add src/app/login/layout.tsx src/app/register/layout.tsx src/app/account/layout.tsx 'src/app/account/security/layout.tsx'
git commit -m "feat: add metadata layouts for client-component pages"
```

---

### Task 7: Admin Login Page Metadata

**Files:**
- Create: `src/app/admin/login/layout.tsx`

- [ ] **Create admin login layout**

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Gümüş Güneş admin panel login.",
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Commit**

```bash
git add 'src/app/admin/login/layout.tsx'
git commit -m "feat: add admin login page metadata"
```

---

### Task 8: Build + Verify

- [ ] **Run the build**

```bash
npx next build
```

Verify:
- Build succeeds with no errors
- `GET /sitemap.xml` returns valid XML with products and categories
- `GET /robots.txt` returns correct rules
- No regressions in any page rendering

- [ ] **Final commit (if build fixes needed)**

```bash
git add -A
git commit -m "fix: build fixes after SEO metadata additions"
```
