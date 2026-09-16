import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React App:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#0A0C0F', color: '#F4F6FB', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#F76B5E', fontSize: '1.25rem', marginBottom: '1rem' }}>Pine Audit Runtime Error</h1>
          <pre style={{ background: '#12141A', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #22262F', color: '#F76B5E' }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#FFFFFF', color: '#000000', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Console
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
