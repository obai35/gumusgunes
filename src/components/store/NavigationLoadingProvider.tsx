'use client'

import { createContext, useContext, useState, useCallback, Component, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const CartLoadingScreen = dynamic(() => import('./CartLoadingScreen').then(m => ({ default: m.CartLoadingScreen })), { ssr: false })
const CheckoutLoadingScreen = dynamic(() => import('./CheckoutLoadingScreen').then(m => ({ default: m.CheckoutLoadingScreen })), { ssr: false })

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

class LoadingErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
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
      <LoadingErrorBoundary>
        {loading === 'cart' && <CartLoadingScreen />}
        {loading === 'checkout' && <CheckoutLoadingScreen />}
      </LoadingErrorBoundary>
    </NavCtx.Provider>
  )
}
