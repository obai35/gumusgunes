'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useHydrated } from '@/hooks/use-hydrated'
import { useTranslation } from '@/hooks/use-translation'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/format'
import { User, MapPin, CreditCard, Package } from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { AddressesSection } from './AddressesSection'
import { CardsSection } from './CardsSection'
import { OrdersSection } from './OrdersSection'
import { OrderTrackModal } from './OrderTrackModal'
import type { Order } from './OrdersSection'

type Tab = 'profile' | 'addresses' | 'cards' | 'orders'

const TAB_VALID: Record<string, Tab> = { profile: 'profile', addresses: 'addresses', cards: 'cards', orders: 'orders' }

function TabButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap tab-press',
        active ? 'bg-navy text-silver shadow-md' : 'text-navy/70 hover:bg-secondary hover:text-navy'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

export default function AccountPage() {
  const hydrated = useHydrated()
  const { t } = useTranslation()
  const { user, logout, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: t('account.profile'), icon: User },
    { key: 'addresses', label: t('account.addresses'), icon: MapPin },
    { key: 'cards', label: t('account.paymentMethods'), icon: CreditCard },
    { key: 'orders', label: t('account.orders'), icon: Package },
  ]
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [trackModal, setTrackModal] = useState<Order | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && TAB_VALID[tab]) setActiveTab(tab as Tab)
  }, [hydrated])

  if (!hydrated) return null
  if (!isAuthenticated()) return null

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-silver/30 to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold text-navy">{t('account.myAccount')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('account.welcomeBack')} {user?.name || 'there'}</p>
            </div>
            <Button
              onClick={() => { logout(); router.push('/') }}
              variant="outline"
              className="rounded-full text-sm press"
            >
              {t('account.signOut')}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => (
              <TabButton key={tab.key} active={activeTab === tab.key} label={tab.label} icon={tab.icon} onClick={() => setActiveTab(tab.key)} />
            ))}
          </div>

          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'addresses' && <AddressesSection />}
          {activeTab === 'cards' && <CardsSection />}
          {activeTab === 'orders' && <OrdersSection onTrackOrder={setTrackModal} />}
        </div>
      </div>
      <Footer />

      {trackModal && <OrderTrackModal order={trackModal} onClose={() => setTrackModal(null)} />}
    </>
  )
}
