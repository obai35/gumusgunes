'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useCart, useUI, useWishlist } from '@/lib/store'
import { useAuth } from '@/lib/auth-store'
import { useHydrated } from '@/hooks/use-hydrated'
import { useTranslation } from '@/hooks/use-translation'
import { Search, Heart, ShoppingBag, Menu, X, Sun, User, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/format'
import { CurrencySelector } from './CurrencySelector'
import { LanguageSelector } from './LanguageSelector'
import { LoyaltyBadge } from './LoyaltyBadge'
import type { Category } from '@/lib/types'

export function Header() {
  const router = useRouter()
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const hydrated = useHydrated()
  const { count } = useCart()
  const { setSearchOpen, setWishlistOpen, setMobileMenuOpen, mobileMenuOpen } = useUI()
  const wishlist = useWishlist()
  const [categories, setCategories] = useState<Category[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/site-settings').then(r => r.json()),
    ]).then(([cats, site]) => {
      if (cats.ok) setCategories(cats.categories)
      if (site.ok) setSettings(site.settings)
    }).catch(() => {})
  }, [])

  const navLinks = [
    { label: settings.navCollections || t('nav.collections'), href: '/#collections' },
    { label: settings.navNewArrivals || t('nav.newArrivals'), href: '/#new' },
    { label: settings.navBestsellers || t('nav.bestsellers'), href: '/#bestsellers' },
    { label: settings.navGiftFinder || t('nav.giftFinder'), href: '/#gift-finder' },
    { label: settings.navOurStory || t('nav.ourStory'), href: '/#about' },
  ]

  function selectCategory(slug: string) {
    setOpenDropdown(null)
    const evt = new CustomEvent('gg:select-category', { detail: slug })
    window.dispatchEvent(evt)
    document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cartCount = hydrated ? count() : 0
  const wishlistCount = hydrated ? wishlist.ids.length : 0
  const { user, logout, isAuthenticated } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <>
      <div className="bg-navy-deep text-silver text-xs tracking-[0.2em] uppercase">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-center">
          <Sun className="h-3 w-3 text-gold animate-pulse" />
          <span className="hidden sm:inline">{settings.announcementText || t('announcement.text')}</span>
          <span className="sm:hidden">{settings.announcementTextMobile || t('announcement.textMobile')}</span>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-500 border-b',
          scrolled
            ? 'bg-background/95 backdrop-blur-xl shadow-sm border-border'
            : 'bg-background/80 backdrop-blur-md border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-navy hover:text-gold transition-colors"
              aria-label={t('nav.openMenu')}
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-gold/30 group-hover:ring-gold/60 transition-all">
                <img
                  src={settings.logoUrl || '/gumusgunes-logo.jpeg'}
                  alt={settings.siteName || 'Gümüş Güneş'}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-display text-2xl font-semibold text-navy tracking-wide">
                  {settings.siteName?.split(' ')[0] || 'Gümüş'} <span className="gold-text">{settings.siteName?.split(' ').slice(1).join(' ') || 'Güneş'}</span>
                </span>
                <span className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mt-0.5">
                  {settings.siteTagline || t('brand.tagline')}
                </span>
              </div>
            </Link>

            {/* Nav links with category dropdowns */}
            <nav className="hidden lg:flex items-center gap-8">
              {categories.map((parent) => (
                <div
                  key={parent.id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(parent.slug)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => selectCategory(parent.slug)}
                    className="flex items-center gap-1 text-sm font-medium text-navy/80 hover:text-gold transition-colors group"
                  >
                    {parent.name}
                    <ChevronDown className={cn('h-3 w-3 transition-transform', openDropdown === parent.slug && 'rotate-180')} />
                  </button>
                  {openDropdown === parent.slug && parent.children && (
                    <div className="absolute left-0 top-full pt-2">
                      <div className="bg-white rounded-xl border border-border shadow-xl py-2 min-w-[180px]">
                        <button
                          onClick={() => selectCategory(parent.slug)}
                          className="w-full text-left px-4 py-2 text-sm font-semibold text-navy hover:bg-secondary transition-colors border-b border-border/50"
                        >
                          All {parent.name}
                        </button>
                        {parent.children.map((child: any) => (
                          <button
                            key={child.id}
                            onClick={() => selectCategory(child.slug)}
                            className="w-full text-left px-4 py-2 text-sm text-navy/80 hover:text-gold hover:bg-secondary transition-colors"
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-medium text-navy/80 hover:text-gold transition-colors group"
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block"><LoyaltyBadge /></div>
              <div className="hidden sm:block"><CurrencySelector /></div>
              <div className="hidden sm:block"><LanguageSelector /></div>
              <div className="relative">
                {!hydrated ? (
                  <span className="p-2.5 inline-flex"><User className="h-5 w-5 text-muted-foreground" /></span>
                ) : isAuthenticated() && user ? (
                  <>
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2.5 rounded-full hover:bg-secondary text-navy hover:text-gold transition-colors" aria-label={t('nav.account')}>
                      <User className="h-5 w-5" />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-border shadow-lg py-2 z-50">
                        <div className="px-4 py-2 border-b border-border/50">
                          <p className="text-sm font-medium text-navy truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Link href="/account" onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-navy hover:bg-secondary transition-colors">
                          <User className="h-4 w-4" /> My Account
                        </Link>
                        <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="h-4 w-4" /> {t('nav.signOut')}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/login" className="p-2.5 rounded-full hover:bg-secondary text-navy hover:text-gold transition-colors inline-flex" aria-label={t('nav.login')}>
                    <User className="h-5 w-5" />
                  </Link>
                )}
              </div>
              <button onClick={() => setSearchOpen(true)} className="p-2.5 rounded-full hover:bg-secondary text-navy hover:text-gold transition-colors" aria-label={t('nav.search')}>
                <Search className="h-5 w-5" />
              </button>
              <button onClick={() => setWishlistOpen(true)} className="relative p-2.5 rounded-full hover:bg-secondary text-navy hover:text-gold transition-colors" aria-label={t('nav.wishlist')}>
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gold text-[10px] font-bold text-navy-deep flex items-center justify-center">{wishlistCount}</span>
                )}
              </button>
              <button onClick={() => router.push('/cart')} className="relative p-2.5 rounded-full hover:bg-secondary text-navy hover:text-gold transition-colors" aria-label={t('nav.cart')}>
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-navy text-[10px] font-bold text-silver flex items-center justify-center">{cartCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display text-xl text-navy">Gümüş <span className="gold-text">Güneş</span></span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:text-gold"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex flex-col gap-1">
              {categories.map((parent) => (
                <div key={parent.id}>
                  <button
                    onClick={() => { selectCategory(parent.slug); setMobileMenuOpen(false) }}
                    className="w-full text-left py-3 px-3 rounded-lg text-navy hover:bg-secondary hover:text-gold transition-colors text-base font-semibold border-b border-border/50"
                  >
                    {parent.name}
                  </button>
                  {parent.children?.map((child: any) => (
                    <button
                      key={child.id}
                      onClick={() => { selectCategory(child.slug); setMobileMenuOpen(false) }}
                      className="w-full text-left py-2 pl-8 pr-3 text-sm text-navy/80 hover:text-gold hover:bg-secondary transition-colors"
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              ))}
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-lg text-navy hover:bg-secondary hover:text-gold transition-colors text-base font-medium border-b border-border/50">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-6 text-xs text-muted-foreground">
              <p className="font-display text-base text-navy mb-2">{t('footer.needHelp')}</p>
              <p>concierge@gumusgunes.com</p>
              <p className="mt-1">+90 212 000 00 00</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
