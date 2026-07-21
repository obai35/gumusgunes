'use client'

import { Component, type ReactNode } from 'react'

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

  static getDerivedStateFromProps(_: Props, state: State) {
    if (state.error) return { error: null }
    return null
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Admin render error</h2>
          <p className="text-sm text-muted-foreground mb-2 font-mono bg-gray-100 p-4 rounded text-left whitespace-pre-wrap">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
