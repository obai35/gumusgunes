import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CheckoutContent } from '@/components/store/CheckoutContent'

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <CheckoutContent />
      </main>
      <Footer />
    </>
  )
}
