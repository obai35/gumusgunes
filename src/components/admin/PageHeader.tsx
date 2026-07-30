'use client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  backHref?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, backHref, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-display font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
