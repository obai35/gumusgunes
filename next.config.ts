import type { NextConfig } from "next";

const METADATA_DOMAIN = "https://gumusgunes.com";

// Single source of truth for security headers (R3):
// - generic rule: full set for every route
// - /preview rule: same set but frameable same-origin only (the admin editor
//   renders the storefront live preview in an iframe)
// - 'unsafe-eval' is provably unused (no eval/new Function in src) and omitted
// - 'unsafe-inline' stays for Next hydration scripts (no nonces) - dated
//   exception, see security runbook appendix
// - `payment` permission policy is deliberately left default (Stripe Payment
//   Element wallet buttons need the Payment Request API) - dated exception
const cspDirectives = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.stripe.com https://www.paypal.com https://accounts.google.com https://www.google.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: ${METADATA_DOMAIN} https://*.gumusgunes.com https://lh3.googleusercontent.com https://js.stripe.com https://*.stripe.com https://www.paypal.com;
  connect-src 'self' https://api.stripe.com https://*.stripe.com https://www.paypal.com https://*.upstash.io https://accounts.google.com;
  frame-src 'self' https://js.stripe.com https://*.stripe.com https://www.paypal.com https://accounts.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
  report-uri /api/csp-report;
  report-to csp-endpoint;
`.replace(/\s{2,}/g, ' ').trim()

const cspFor = (frameAncestors: string) => `${cspDirectives} frame-ancestors ${frameAncestors};`

const baseHeaders = (frame: 'DENY' | 'SAMEORIGIN', csp: string) => [
  { key: 'X-Frame-Options', value: frame },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Reporting-Endpoints', value: 'csp-endpoint="/api/csp-report"' },
]

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.stripe.com' },
    ],
  },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: baseHeaders('DENY', cspFor("'none'")),
      },
      {
        source: '/preview',
        headers: baseHeaders('SAMEORIGIN', cspFor("'self'")),
      },
    ]
  },
};

export default nextConfig;