'use client';

import { Circle, Coins, Cpu, Database } from '@phosphor-icons/react';

interface StatusBarProps {
  status: 'Ready' | 'Processing' | 'Error';
  model: string;
  tokens: number;
  credits: number;
}

export function StatusBar({ status, model, tokens, credits }: StatusBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'Ready': return 'bg-green-500';
      case 'Processing': return 'bg-signal-light animate-pulse-dot';
      case 'Error': return 'bg-signal';
      default: return 'bg-slate';
    }
  };

  const formatTokens = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <footer className="h-10 bg-ink flex items-center justify-between px-6 flex-shrink-0 mx-4 mb-3 rounded-pill">
      {/* Left - Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Circle weight="fill" className={`w-2 h-2 ${getStatusColor()}`} />
          <span className="text-canvas text-sm font-500">{status}</span>
        </div>
        
        <div className="h-4 w-px bg-charcoal" />
        
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate" />
          <span className="text-canvas text-sm">{model}</span>
        </div>
      </div>

      {/* Right - Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate" />
          <span className="text-canvas text-sm">Context: {formatTokens(tokens)} tokens</span>
        </div>
        
        <div className="h-4 w-px bg-charcoal" />
        
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-signal-light" />
          <span className="text-canvas text-sm font-500">{credits.toLocaleString()} credits</span>
        </div>
      </div>
    </footer>
  );
}
