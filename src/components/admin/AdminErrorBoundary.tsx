'use client'

import { Component, type ReactNode } from 'react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('AdminShell error caught by AdminErrorBoundary:', error)
    console.error('Component stack:', info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <AdminErrorFallback error={this.state.error} onRetry={() => this.setState({ error: null })} />
      )
    }
    return this.props.children
  }
}

function AdminErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { ta } = useAdminTranslate()
  return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-semibold text-red-600 mb-2">{ta('Admin render error')}</h2>
      <p className="text-sm text-muted-foreground mb-2 font-mono bg-gray-100 p-4 rounded text-left whitespace-pre-wrap">
        {error.message}
        {'\n\n'}
        {error.stack}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"
      >
        {ta('Try again')}
      </button>
    </div>
  )
}
