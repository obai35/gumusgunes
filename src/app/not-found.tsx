import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-gold/30 mx-auto mb-6">
          <img src="/gumusgunes-logo.jpeg" alt="Gümüş Güneş" className="h-full w-full object-cover" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy mb-2">Page Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/">
          <Button className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">Go Home</Button>
        </Link>
      </div>
    </div>
  )
}
