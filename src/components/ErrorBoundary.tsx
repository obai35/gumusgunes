'use client'

import { Component, type ReactNode } from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'

function Fallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
      <p className="text-sm text-muted-foreground mb-2">Something went wrong</p>
      <button
        onClick={resetErrorBoundary}
        className="text-xs text-gold hover:underline"
      >
        Try again
      </button>
    </div>
  )
}

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <Fallback error={new Error()} resetErrorBoundary={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}
