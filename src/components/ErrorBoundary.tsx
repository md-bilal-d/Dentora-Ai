import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] bg-white rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-red-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Component Error</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-1">Something went wrong while loading this module.</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-auto text-left mt-2">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button 
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
