import { Component, type ErrorInfo, type ReactNode } from 'react'

/** Last line of defence: a render crash shows a recoverable screen instead of a blank WebView. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(_e: Error, _i: ErrorInfo) { /* no analytics SDK by design; nothing leaves the device */ }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" style={{ padding: 24, textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>Something went wrong</h1>
        <p>Your saved hymns are safe.</p>
        <button onClick={() => location.reload()} style={{ padding: '12px 24px', fontSize: 18 }}>Restart</button>
      </div>
    )
  }
}
