/**
 * Injects demo/sandbox mode protections into generated storefronts.
 * In demo mode: watermarks, disables real payments, limits data, shows trial banner.
 */

export interface DemoConfig {
  enabled: boolean
  expiresAt?: string
  storeName: string
}

const DEMO_BANNER_SCRIPT = `
;(function() {
  var s = document.createElement('style');
  s.textContent = '#__demo_banner { position:fixed; bottom:0; left:0; right:0; background:#dc2626; color:white; text-align:center; padding:6px 12px; font-size:13px; font-family:sans-serif; z-index:99999; display:flex; align-items:center; justify-content:center; gap:8px; } #__demo_banner a { color:#fef08a; text-decoration:underline; }';
  document.head.appendChild(s);
  var b = document.createElement('div');
  b.id = '__demo_banner';
  b.innerHTML = '🔒 DEMO MODE — <strong>{{STORE_NAME}}</strong> — Not for commercial use. <a href="mailto:{{CONTACT_EMAIL}}">Request full version</a>';
  document.body.appendChild(b);
})();
`

export function injectDemoGuard(content: string, config: DemoConfig): string {
  if (!config.enabled) return content

  const result = content.replace(
    '</body>',
    `<script>${DEMO_BANNER_SCRIPT.replace(/{{STORE_NAME}}/g, config.storeName).replace(/{{CONTACT_EMAIL}}/g, 'hello@storebuilder.com')}</script></body>`
  )
  return result
}

export function injectDemoAPIGuard(routeContent: string, config: DemoConfig): string {
  if (!config.enabled) return routeContent

  // Add demo check at the top of API routes
  const guardCheck = `
  // Demo mode protection
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ error: 'This feature is disabled in demo mode' }, { status: 403 })
  }
  `
  // Insert after imports
  return routeContent.replace(
    /(import .*?;\s*)/,
    (match) => match + '\n' + guardCheck
  )
}

export const DEMO_ENV_CONTENT = `# Demo Mode
DEMO_MODE=true
DEMO_EXPIRES_AT=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}
CONTACT_EMAIL=hello@storebuilder.com
`