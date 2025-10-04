import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    // Podríamos enviar el error a algún servicio aquí si se desea
    console.error('UI ErrorBoundary:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null })
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            info={this.state.info}
            onReset={this.handleReset}
          />
        )
      }
      return (
        <div style={{ padding: 16 }}>
          <h2 style={{ marginBottom: 8 }}>Ha ocurrido un error en la interfaz</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {String(this.state.error)}
          </pre>
          {this.state.info?.componentStack && (
            <details style={{ marginTop: 8 }}>
              <summary>Detalles</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.info.componentStack}</pre>
            </details>
          )}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={this.handleReset}>Cerrar</button>
            <button onClick={() => window.location.reload()}>Recargar</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function DefaultErrorFallback({ error, info, onReset }) {
  return (
    <div className="p-4 m-4 border rounded bg-red-50 text-red-700">
      <h2 className="font-semibold mb-2">Ha ocurrido un error</h2>
      <pre className="whitespace-pre-wrap text-sm">{String(error)}</pre>
      {info?.componentStack && (
        <details className="mt-2 text-xs">
          <summary>Detalles</summary>
          <pre className="whitespace-pre-wrap">{info.componentStack}</pre>
        </details>
      )}
      <div className="mt-3 flex gap-2 flex-wrap">
        <button className="px-3 py-1 border rounded" onClick={onReset}>Cerrar</button>
        <button className="px-3 py-1 border rounded" onClick={() => window.location.reload()}>Recargar</button>
        <button
          className="px-3 py-1 border rounded"
          onClick={() => {
            try {
              localStorage.clear();
            } catch (err) {
              // Ignorar errores de acceso a localStorage (p. ej., modo privado o permisos)
              console.warn('localStorage.clear failed', err);
            }
            window.location.reload();
          }}
        >
          Limpiar datos y recargar
        </button>
      </div>
    </div>
  )
}

