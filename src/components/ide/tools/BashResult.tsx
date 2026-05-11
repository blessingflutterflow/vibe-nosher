'use client';

import { Terminal, Copy, Check, CaretDown, CaretRight } from '@phosphor-icons/react';
import { useState } from 'react';

interface BashResultProps {
  command: string;
  output: string;
  exitCode?: number;
  collapsed?: boolean;
}

export function BashResult({ command, output, exitCode = 0, collapsed = false }: BashResultProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [copied, setCopied] = useState(false);

  const safeOutput = output || '';
  const lines = safeOutput.split('\n');
  const isSuccess = exitCode === 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(safeOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-editor-bg rounded-2xl border border-bone overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-editor-surface border-b border-bone/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate" />
          <code className="text-xs font-mono text-canvas/80 truncate max-w-[300px]">
            $ {command}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span className={`
            text-xs px-2 py-0.5 rounded-full
            ${isSuccess ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
          `}>
            {isSuccess ? 'Success' : `Exit ${exitCode}`}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {isExpanded ? (
              <CaretDown className="w-4 h-4 text-slate" />
            ) : (
              <CaretRight className="w-4 h-4 text-slate" />
            )}
          </button>
        </div>
      </div>

      {/* Output */}
      {isExpanded && (
        <div className="relative">
          <div className="p-4 max-h-64 overflow-y-auto">
            <pre className="text-xs font-mono leading-relaxed">
              {lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 flex-shrink-0 text-slate/50 text-right pr-2 select-none">
                    {i + 1}
                  </span>
                  <code className={`
                    ${line.startsWith('Error') || line.startsWith('error') ? 'text-red-400' : 'text-canvas/90'}
                  `}>
                    {line}
                  </code>
                </div>
              ))}
            </pre>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded bg-editor-surface/80 hover:bg-editor-surface transition-colors"
            title="Copy output"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" weight="bold" />
            ) : (
              <Copy className="w-4 h-4 text-slate" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
