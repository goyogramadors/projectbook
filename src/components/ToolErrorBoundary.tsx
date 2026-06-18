/* =============================================================================
   ToolErrorBoundary.tsx — AISLAMIENTO DE FALLOS DE HERRAMIENTA (F5 · estabilidad)
   -----------------------------------------------------------------------------
   Error Boundary de React (componente de clase: única forma soportada). Si una
   herramienta lanza durante el render, captura el error y muestra un fallback
   local con opción de reintento, evitando que toda la SPA caiga a pantalla blanca.
   Se resetea automáticamente al cambiar de herramienta (prop resetKey).
   ============================================================================= */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey?: string;        // al cambiar (p. ej. el id de la tool) se limpia el error
  label?: string;
}
interface State {
  hasError: boolean;
  message: string;
}

export default class ToolErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Error desconocido en la herramienta.' };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Punto de enganche para telemetría futura (sin console.log en producción).
    void error; void info;
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: '' });
    }
  }

  private handleReset = (): void => this.setState({ hasError: false, message: '' });

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="ab-render" style={{ display: 'block', textAlign: 'left' }}>
        <div className="ab-render-title" style={{ color: 'var(--destructive)' }}>
          [ FALLO EN EL MÓDULO{this.props.label ? `: ${this.props.label}` : ''} ]
        </div>
        <p style={{ fontSize: 12, opacity: 0.8, margin: '8px 0 14px', maxWidth: 640 }}>
          La herramienta encontró un error y se aisló para no afectar al resto de la plataforma.
          Puedes reintentar o cambiar de módulo.
        </p>
        <pre style={{ fontSize: 11, background: 'var(--muted)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 10, overflowX: 'auto', maxWidth: 640 }}>
          {this.state.message}
        </pre>
        <button className="ab-btn" style={{ marginTop: 12 }} onClick={this.handleReset}>Reintentar</button>
      </div>
    );
  }
}
