'use client'

import { useState, useEffect } from 'react'
import { useCart, useUI, useWishlist } from '@/lib/store'
import { useHydrated } from '@/hooks/use-hydrated'
import { Search, Heart, ShoppingBag, Menu, X, Sun } from 'lucide-react'
import { cn } from '@/lib/format'
import { CurrencySelector } from './CurrencySelector'
import { LoyaltyBadge } from './LoyaltyBadge'

const navLinks = [
  { label: 'Collections', href: '#collections' },
  { label: 'Categories', href: '#categories' },
  { label: 'New Arrivals', href: '#new' },
  { label: 'Bestsellers', href: '#bestsellers' },
  { label: 'Our Story', href: '#about' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const hydrated = useHydrated()
  const { openCart, count } = useCart()
  const { setSearchOpen, setWishlistOpen, setMobileMenuOpen, mobileMenuOpen } = useUI()
  const wishlist = useWishlist()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll() // initialize without extra render
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cartCount = hydrated ? count() : 0
  const wishlistCount = hydrated ? wishlist.ids.length : 0

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-navy-deep text-silver text-xs tracking-[0.2em] uppercase">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-center">
          <Sun className="h-3 w-3 text-gold animate-pulse" />
          <span className="hidden sm:inline">Complimentary shipping on orders over $250 · Lifetime warranty on every piece</span>
          <span className="sm:hidden">Free shipping over $250</span>
        </div>
      </div>

      {/* Main header */}
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
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-navy hover:text-gold transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <a href="#top" className="flex items-center gap-3 group">
              <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-gold/30 group-hover:ring-gold/60 transition-all">
                <img
                  src="/gumusgunes-logo.jpeg"
                  alt="Gümüş Güneş — Silver Sun"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-display text-2xl font-semibold text-navy tracking-wide">
                  Gümüş <span className="gold-text">Güneş</span>
                </span>
                <span className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mt-0.5">
                  Silver Sun · Est. 2019
                </span>
              </div>
            </a>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-medium text-navy/80 hover:text-gold transition-colors group"
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block">
                <LoyaltyBadge />
              </div>
              <div className="hidden sm:block">
                <CurrencySelector />
              </div>
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-full hover:bg-secondary text-navy hover:text-gold transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => setWishlistOpen(true)}
                className="relative p-2.5 rounded-full hover:bg-secondary text-navy hover:text-gold transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gold text-[10px] font-bold text-navy-deep flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={openCart}
                className="relative p-2.5 rounded-full hover:bg-secondary text-navy hover:text-gold transition-colors"
                aria-label="Shopping bag"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-navy text-[10px] font-bold text-silver flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display text-xl text-navy">
                Gümüş <span className="gold-text">Güneş</span>
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:text-gold">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 px-3 rounded-lg text-navy hover:bg-secondary hover:text-gold transition-colors text-base font-medium border-b border-border/50"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto pt-6 text-xs text-muted-foreground">
              <p className="font-display text-base text-navy mb-2">Need help?</p>
              <p>concierge@gumusgunes.com</p>
              <p className="mt-1">+90 212 000 00 00</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
