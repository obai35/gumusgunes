'use client'

import { Component, type ReactNode } from 'react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

interface Props { children: ReactNode; fallback?: ReactNode; onRetry?: () => void }
interface State { hasError: boolean; error: Error | null; prevChildren: ReactNode | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, prevChildren: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (state.hasError && props.children !== state.prevChildren) {
      return { hasError: false, error: null, prevChildren: props.children }
    }
    return { prevChildren: props.children }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <ErrorBoundaryFallback message={this.state.error?.message} onRetry={this.handleRetry} />
      )
    }
    return this.props.children
  }
}

function ErrorBoundaryFallback({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const { ta } = useAdminTranslate()
  return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-semibold text-red-600 mb-2">{ta('Something went wrong')}</h2>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-navy text-silver rounded-lg text-sm hover:bg-navy/90 transition-colors"
        >
          {ta('Try again')}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          {ta('Reload page')}
        </button>
      </div>
    </div>
  )
}
