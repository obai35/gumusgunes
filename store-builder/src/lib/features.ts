export interface Feature {
  key: string
  name: string
  description: string
  group: 'storefront' | 'admin' | 'accounting' | 'marketing' | 'content' | 'system'
  icon: string
  defaultEnabled: boolean
}

export const FEATURES: Feature[] = [
  // ── Storefront ──
  { key: 'storefront', name: 'Storefront', description: 'Full product catalog & landing page', group: 'storefront', icon: 'ShoppingBag', defaultEnabled: true },
  { key: 'cart', name: 'Shopping Cart', description: 'Add to cart, checkout flow', group: 'storefront', icon: 'ShoppingCart', defaultEnabled: true },
  { key: 'checkout', name: 'Checkout', description: 'Payment, shipping, order confirmation', group: 'storefront', icon: 'CreditCard', defaultEnabled: true },
  { key: 'wishlist', name: 'Wishlist', description: 'Save products to wishlist', group: 'storefront', icon: 'Heart', defaultEnabled: false },
  { key: 'reviews', name: 'Reviews & Ratings', description: 'Product reviews and star ratings', group: 'storefront', icon: 'Star', defaultEnabled: false },
  { key: 'productRelations', name: 'Related Products', description: 'Cross-sell, upsell, related items', group: 'storefront', icon: 'Link', defaultEnabled: true },
  { key: 'backInStock', name: 'Back in Stock Alerts', description: 'Notify customers when items restock', group: 'storefront', icon: 'Bell', defaultEnabled: false },
  { key: 'giftCards', name: 'Gift Cards', description: 'Sell and redeem gift cards', group: 'storefront', icon: 'Gift', defaultEnabled: false },
  { key: 'multiCurrency', name: 'Multi-Currency', description: 'Display prices in multiple currencies', group: 'storefront', icon: 'DollarSign', defaultEnabled: false },
  { key: 'multiLanguage', name: 'Multi-Language', description: 'Arabic/English language support', group: 'storefront', icon: 'Languages', defaultEnabled: false },
  { key: 'userAccounts', name: 'Customer Accounts', description: 'Registration, login, order history', group: 'storefront', icon: 'User', defaultEnabled: true },

  // ── Content ──
  { key: 'blog', name: 'Blog', description: 'Blog posts and articles', group: 'content', icon: 'FileText', defaultEnabled: false },
  { key: 'faq', name: 'FAQ', description: 'Frequently asked questions page', group: 'content', icon: 'HelpCircle', defaultEnabled: false },
  { key: 'banners', name: 'Banners & Hero', description: 'Homepage banners and hero sections', group: 'content', icon: 'Image', defaultEnabled: true },
  { key: 'staticPages', name: 'Static Pages', description: 'About, contact, privacy, terms pages', group: 'content', icon: 'File', defaultEnabled: true },
  { key: 'newsletter', name: 'Newsletter', description: 'Email subscription signup', group: 'content', icon: 'Mail', defaultEnabled: false },

  // ── Marketing ──
  { key: 'discounts', name: 'Discount Codes', description: 'Coupon codes and promotions', group: 'marketing', icon: 'Percent', defaultEnabled: true },
  { key: 'saleCampaigns', name: 'Sale Campaigns', description: 'Seasonal sales and flash deals', group: 'marketing', icon: 'Megaphone', defaultEnabled: false },
  { key: 'emailCampaigns', name: 'Email Marketing', description: 'Send campaigns to customers', group: 'marketing', icon: 'Send', defaultEnabled: false },
  { key: 'pushCampaigns', name: 'Push Notifications', description: 'Send push notifications to customers', group: 'marketing', icon: 'BellRing', defaultEnabled: false },
  { key: 'abandonedCart', name: 'Abandoned Cart Recovery', description: 'Recover lost sales automatically', group: 'marketing', icon: 'RefreshCw', defaultEnabled: false },
  { key: 'referrals', name: 'Referral Program', description: 'Customer referral rewards', group: 'marketing', icon: 'Users', defaultEnabled: false },
  { key: 'socialMedia', name: 'Social Media Integration', description: 'Post to Instagram/Facebook', group: 'marketing', icon: 'Share2', defaultEnabled: false },

  // ── Accounting ──
  { key: 'basicAccounting', name: 'Basic Accounting', description: 'Orders, revenue, expenses tracking', group: 'accounting', icon: 'BookOpen', defaultEnabled: true },
  { key: 'doubleEntry', name: 'Double-Entry Ledger', description: 'Full accounting with journal entries', group: 'accounting', icon: 'Book', defaultEnabled: false },
  { key: 'financialReports', name: 'Financial Reports', description: 'P&L, balance sheet, cash flow', group: 'accounting', icon: 'BarChart', defaultEnabled: false },
  { key: 'bankReconciliation', name: 'Bank Reconciliation', description: 'Match bank transactions to entries', group: 'accounting', icon: 'Landmark', defaultEnabled: false },
  { key: 'payroll', name: 'Payroll Management', description: 'Employee salaries and payroll runs', group: 'accounting', icon: 'Receipt', defaultEnabled: false },
  { key: 'invoicing', name: 'Invoicing', description: 'Send invoices to customers', group: 'accounting', icon: 'FileInvoice', defaultEnabled: false },
  { key: 'bills', name: 'Bills & AP', description: 'Supplier bills and payments', group: 'accounting', icon: 'FileText', defaultEnabled: false },

  // ── Admin Features ──
  { key: 'adminDashboard', name: 'Dashboard', description: 'Admin dashboard with metrics', group: 'admin', icon: 'LayoutDashboard', defaultEnabled: true },
  { key: 'productManagement', name: 'Product Management', description: 'Add/edit/delete products', group: 'admin', icon: 'Package', defaultEnabled: true },
  { key: 'orderManagement', name: 'Order Management', description: 'View, process, ship orders', group: 'admin', icon: 'Truck', defaultEnabled: true },
  { key: 'customerManagement', name: 'Customer Management', description: 'View and manage customers', group: 'admin', icon: 'Users', defaultEnabled: true },
  { key: 'pos', name: 'Point of Sale', description: 'In-person sales interface', group: 'admin', icon: 'Wallet', defaultEnabled: false },
  { key: 'inventory', name: 'Inventory Management', description: 'Stock levels, transfers, warehouses', group: 'admin', icon: 'Archive', defaultEnabled: true },
  { key: 'shipping', name: 'Shipping Configuration', description: 'Shipping methods, rates, rules', group: 'admin', icon: 'Plane', defaultEnabled: true },
  { key: 'analytics', name: 'Analytics & Reports', description: 'Sales analytics and scheduled reports', group: 'admin', icon: 'TrendingUp', defaultEnabled: false },

  // ── System ──
  { key: 'roleManagement', name: 'Admin Roles & Permissions', description: 'Role-based access control', group: 'system', icon: 'Shield', defaultEnabled: true },
  { key: 'multiBranch', name: 'Multi-Branch', description: 'Multiple branch locations', group: 'system', icon: 'Building2', defaultEnabled: false },
  { key: 'chat', name: 'WhatsApp Chat', description: 'Customer chat via WhatsApp', group: 'system', icon: 'MessageCircle', defaultEnabled: false },
  { key: 'webhooks', name: 'Webhooks', description: 'Outbound event webhooks', group: 'system', icon: 'Webhook', defaultEnabled: false },
  { key: 'apiKeys', name: 'API Keys', description: 'REST API access keys', group: 'system', icon: 'Key', defaultEnabled: false },
  { key: 'auditLogs', name: 'Audit Logs', description: 'Activity tracking and audit trail', group: 'system', icon: 'ClipboardList', defaultEnabled: true },
  { key: 'seo', name: 'SEO Tools', description: 'Meta tags, sitemap, structured data', group: 'system', icon: 'Search', defaultEnabled: true },
]

export type FeatureKey = typeof FEATURES[number]['key']
export type FeatureGroup = typeof FEATURES[number]['group']

export function getFeature(key: string): Feature | undefined {
  return FEATURES.find(f => f.key === key)
}

export function getFeaturesByGroup(group: FeatureGroup): Feature[] {
  return FEATURES.filter(f => f.group === group)
}

export const MODULE_FILE_MAP: Record<string, string[]> = {
  storefront: [
    'app/page.tsx', 'app/products/', 'app/product/', 'app/layout.tsx', 'components/store/',
  ],
  cart: ['app/cart/', 'components/store/CartDrawer.tsx'],
  checkout: ['app/checkout/', 'app/api/checkout/'],
  wishlist: ['app/wishlist/', 'components/store/WishlistButton.tsx'],
  reviews: ['components/store/ReviewForm.tsx', 'components/store/ReviewList.tsx'],
  blog: ['app/blog/', 'app/admin/blog/', 'app/api/admin/blog/'],
  faq: ['app/faq/', 'app/admin/faq/', 'app/api/admin/faq/'],
  banners: ['components/store/HeroBanner.tsx'],
  staticPages: ['app/about/', 'app/contact/', 'app/privacy/', 'app/terms/'],
  newsletter: ['app/api/newsletter/', 'components/store/NewsletterForm.tsx'],
  discounts: ['app/admin/discounts/', 'app/api/admin/discounts/'],
  giftCards: ['app/gift-cards/', 'app/admin/gift-cards/'],
  pos: ['app/admin/pos/', 'app/api/admin/pos/'],
  chat: ['app/admin/chat/', 'app/api/admin/chat/'],
  doubleEntry: ['app/admin/accounting/', 'app/api/admin/accounting/'],
  financialReports: ['app/admin/reports/', 'app/api/admin/reports/'],
  payroll: ['app/admin/payroll/', 'app/api/admin/payroll/'],
  multiBranch: ['app/admin/branches/', 'app/api/admin/branches/'],
}

export function getFilesForFeature(featureKey: string): string[] {
  return MODULE_FILE_MAP[featureKey] || []
}

export const DEFAULT_ENABLED_FEATURES = FEATURES.filter(f => f.defaultEnabled).map(f => f.key)