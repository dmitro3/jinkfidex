import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: 300, padding: "2rem", textAlign: "center",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <AlertTriangle size={24} color="#f87171" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: "0.4rem" }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "1.25rem", maxWidth: 360 }}>
            {this.state.error?.message ?? "An unexpected error occurred in this component."}
          </div>
          <button
            onClick={this.reset}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.55rem 1.1rem", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--bg-card2)", color: "var(--text)", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
            }}
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Wrap a page in a full-page error boundary */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
