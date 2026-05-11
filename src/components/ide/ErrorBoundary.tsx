'use client';

import { Component, type ReactNode } from 'react';
import { Warning } from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  crashed: boolean;
  error: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { crashed: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { crashed: true, error: error.message };
  }

  render() {
    if (this.state.crashed) {
      return this.props.fallback ?? (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
          <Warning className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-500">Could not render this result</span>
        </div>
      );
    }
    return this.props.children;
  }
}
