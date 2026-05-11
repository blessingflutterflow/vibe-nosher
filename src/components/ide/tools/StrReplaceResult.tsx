'use client';

import { ArrowsLeftRight, Check, X, FileText } from '@phosphor-icons/react';
import { useState } from 'react';

interface FileChange {
  path: string;
  oldString: string;
  newString: string;
}

interface StrReplaceResultProps {
  changes: FileChange[];
  onAccept?: () => void;
  onReject?: () => void;
}

function DiffLine({ type, content }: { type: 'old' | 'new' | 'context'; content: string }) {
  const bgColor = {
    old: 'bg-red-50',
    new: 'bg-green-50',
    context: 'bg-transparent',
  }[type];

  const borderColor = {
    old: 'border-l-red-400',
    new: 'border-l-green-400',
    context: 'border-l-transparent',
  }[type];

  const prefix = {
    old: '-',
    new: '+',
    context: ' ',
  }[type];

  return (
    <div className={`flex ${bgColor} border-l-2 ${borderColor}`}>
      <span className="w-6 flex-shrink-0 text-xs text-slate text-right pr-2 select-none">
        {prefix}
      </span>
      <code className="text-xs font-mono text-ink whitespace-pre-wrap break-all py-0.5">
        {content}
      </code>
    </div>
  );
}

export function StrReplaceResult({ changes, onAccept, onReject }: StrReplaceResultProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set(changes.map(c => c.path)));

  const toggleFile = (path: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderDiff = (change: FileChange) => {
    const oldLines = change.oldString.split('\n');
    const newLines = change.newString.split('\n');
    
    // Simple diff - show old as removed, new as added
    return (
      <div className="font-mono">
        {oldLines.map((line, i) => (
          line !== '' && <DiffLine key={`old-${i}`} type="old" content={line} />
        ))}
        {newLines.map((line, i) => (
          line !== '' && <DiffLine key={`new-${i}`} type="new" content={line} />
        ))}
      </div>
    );
  };

  if (changes.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-bone">
        <p className="text-sm text-slate">No changes to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-bone overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-lifted border-b border-bone flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowsLeftRight className="w-4 h-4 text-signal-light" />
          <span className="text-sm font-500 text-ink">Proposed Changes</span>
          <span className="px-2 py-0.5 bg-signal-light/20 text-signal-light text-xs rounded-full">
            {changes.length} file{changes.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate text-slate text-sm hover:bg-bone transition-colors"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-canvas text-sm hover:bg-ink/90 transition-colors"
          >
            <Check className="w-4 h-4" weight="bold" />
            Accept
          </button>
        </div>
      </div>

      {/* Changes */}
      <div className="divide-y divide-bone">
        {changes.map((change) => (
          <div key={change.path}>
            {/* File Header */}
            <button
              onClick={() => toggleFile(change.path)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-lifted transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate" />
                <span className="text-sm font-500 text-ink">{change.path}</span>
              </div>
              <span className="text-xs text-slate">
                {expandedFiles.has(change.path) ? 'Collapse' : 'Expand'}
              </span>
            </button>

            {/* Diff */}
            {expandedFiles.has(change.path) && (
              <div className="px-4 pb-4 bg-canvas">
                <div className="rounded-lg border border-bone overflow-hidden">
                  {renderDiff(change)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
