'use client';

import { FileCode, Circle, Flask } from '@phosphor-icons/react';

interface HeaderProps {
  projectName: string;
  mode: 'DEFAULT' | 'MAX' | 'FAST' | 'PLAN';
  credits: number;
  onDiagnostics?: () => void;
}

export function Header({ projectName, mode, credits, onDiagnostics }: HeaderProps) {
  return (
    <header className="h-14 bg-ink flex items-center justify-between px-6 flex-shrink-0">
      {/* Left - Logo & Project */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileCode weight="fill" className="w-6 h-6 text-signal-light" />
          <span className="text-canvas font-500 text-lg tracking-tight">VibeCoder</span>
        </div>
        
        <div className="h-6 w-px bg-charcoal" />
        
        <div className="flex items-center gap-2">
          <span className="text-slate text-sm">Project:</span>
          <span className="text-canvas font-500">{projectName}</span>
        </div>
      </div>

      {/* Center - Mode */}
      <div className="flex items-center gap-3">
        <span className="text-slate text-sm">Mode:</span>
        <span className="px-3 py-1 rounded-pill bg-signal-light/20 text-signal-light text-sm font-500">
          {mode}
        </span>
      </div>

      {/* Right - Credits + Diagnostics */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Circle weight="fill" className="w-2 h-2 text-green-500 animate-pulse-dot" />
          <span className="text-slate text-sm">Connected</span>
        </div>
        <div className="h-6 w-px bg-charcoal" />
        <div className="flex items-center gap-2">
          <span className="text-slate text-sm">Credits:</span>
          <span className="text-canvas font-500">{credits.toLocaleString()}</span>
        </div>

        {onDiagnostics && (
          <>
            <div className="h-6 w-px bg-charcoal" />
            <button
              onClick={onDiagnostics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-white/5 hover:bg-white/10 transition-colors"
              title="Run diagnostics"
            >
              <Flask className="w-3.5 h-3.5 text-signal-light" />
              <span className="text-canvas text-xs font-500">Diagnostics</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
