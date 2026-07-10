'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CartLoadingScreen } from './CartLoadingScreen'
import { CheckoutLoadingScreen } from './CheckoutLoadingScreen'

type LoadingType = 'cart' | 'checkout' | null

type NavContext = {
  loading: LoadingType
  navigateToCart: () => void
  navigateToCheckout: () => void
}

const NavCtx = createContext<NavContext>({
  loading: null,
  navigateToCart: () => {},
  navigateToCheckout: () => {},
})

export function usePageNavigation() {
  return useContext(NavCtx)
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState<LoadingType>(null)

  const navigateToCart = useCallback(() => {
    setLoading('cart')
    setTimeout(() => {
      router.push('/cart')
      setTimeout(() => setLoading(null), 100)
    }, 2800)
  }, [router])

  const navigateToCheckout = useCallback(() => {
    setLoading('checkout')
    setTimeout(() => {
      router.push('/checkout')
      setTimeout(() => setLoading(null), 100)
    }, 2800)
  }, [router])

  return (
    <NavCtx.Provider value={{ loading, navigateToCart, navigateToCheckout }}>
      {children}
      {loading === 'cart' && <CartLoadingScreen />}
      {loading === 'checkout' && <CheckoutLoadingScreen />}
    </NavCtx.Provider>
  )
}
