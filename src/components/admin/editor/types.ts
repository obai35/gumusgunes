export type SectionKey = 'theme' | 'branding' | 'hero' | 'announcement' | 'navigation' | 'footer' | 'layout' | 'seo' | 'customCode'

export type NavItem = {
  id: string
  label: string
  href: string
  badge?: string
  children?: NavItem[]
}

export type FooterColumn = {
  title: string
  links: { label: string; href: string }[]
}

export type SocialLink = {
  platform: string
  url: string
}

export type SectionConfig = {
  key: SectionKey
  label: string
  icon: string
}

export const EDITOR_SECTIONS: SectionConfig[] = [
  { key: 'theme', label: 'Theme', icon: 'Palette' },
  { key: 'branding', label: 'Branding', icon: 'Tag' },
  { key: 'hero', label: 'Hero', icon: 'Layout' },
  { key: 'announcement', label: 'Announcement', icon: 'ShoppingBag' },
  { key: 'navigation', label: 'Navigation', icon: 'Globe' },
  { key: 'footer', label: 'Footer', icon: 'Text' },
  { key: 'layout', label: 'Layout', icon: 'Grid3x3' },
  { key: 'seo', label: 'SEO', icon: 'Search' },
  { key: 'customCode', label: 'Custom Code', icon: 'Code' },
]
