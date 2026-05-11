'use client';

import { useState } from 'react';
import { X, Check, FileText, CaretDown, CaretRight, ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import Editor from '@monaco-editor/react';

interface FileChange {
  id: string;
  path: string;
  oldContent: string;
  newContent: string;
  language?: string;
}

interface ReviewScreenProps {
  isOpen: boolean;
  changes: FileChange[];
  onAccept: (changeIds: string[]) => void;
  onReject: () => void;
  onClose: () => void;
}

function DiffView({ oldContent, newContent, language = 'typescript' }: { 
  oldContent: string; 
  newContent: string;
  language?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Old Version */}
      <div className="flex flex-col h-full rounded-xl overflow-hidden border border-red-200">
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <span className="text-xs font-500 text-red-600 uppercase">Before</span>
        </div>
        <div className="flex-1 bg-editor-bg">
          <Editor
            height="100%"
            language={language}
            value={oldContent}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              lineNumbers: 'on',
              readOnly: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>

      {/* New Version */}
      <div className="flex flex-col h-full rounded-xl overflow-hidden border border-green-200">
        <div className="px-3 py-2 bg-green-50 border-b border-green-200 flex items-center gap-2">
          <span className="text-xs font-500 text-green-600 uppercase">After</span>
        </div>
        <div className="flex-1 bg-editor-bg">
          <Editor
            height="100%"
            language={language}
            value={newContent}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              lineNumbers: 'on',
              readOnly: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function ReviewScreen({ isOpen, changes, onAccept, onReject, onClose }: ReviewScreenProps) {
  const [selectedChangeId, setSelectedChangeId] = useState<string>(changes[0]?.id || '');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set(changes.map(c => c.id)));
  const [acceptedChanges, setAcceptedChanges] = useState<Set<string>>(new Set());

  if (!isOpen || changes.length === 0) return null;

  const selectedChange = changes.find(c => c.id === selectedChangeId) || changes[0];
  const currentIndex = changes.findIndex(c => c.id === selectedChangeId);

  const toggleFile = (id: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAcceptCurrent = () => {
    setAcceptedChanges(prev => {
      const next = new Set(prev);
      next.add(selectedChangeId);
      return next;
    });
    
    // Move to next if available
    if (currentIndex < changes.length - 1) {
      setSelectedChangeId(changes[currentIndex + 1].id);
    }
  };

  const handleAcceptAll = () => {
    onAccept(changes.map(c => c.id));
  };

  const handleAcceptSelected = () => {
    onAccept(Array.from(acceptedChanges));
  };

  const handleReject = () => {
    onReject();
  };

  const navigateChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedChangeId(changes[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < changes.length - 1) {
      setSelectedChangeId(changes[currentIndex + 1].id);
    }
  };

  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'py': 'python',
    };
    return langMap[ext || ''] || 'text';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-6xl h-[85vh] bg-canvas rounded-3xl shadow-elevated overflow-hidden flex flex-col"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        {/* Header */}
        <header className="h-16 bg-lifted border-b border-bone flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-signal-light" />
              <span className="text-xs font-700 uppercase tracking-wider text-slate">
                Review Changes
              </span>
            </div>
            <div className="h-6 w-px bg-bone" />
            <span className="text-sm text-ink">
              {changes.length} file{changes.length > 1 ? 's' : ''} modified
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-1 bg-white rounded-full p-1">
              <button
                onClick={() => navigateChange('prev')}
                disabled={currentIndex === 0}
                className="p-2 rounded-full hover:bg-bone disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-ink px-2">
                {currentIndex + 1} / {changes.length}
              </span>
              <button
                onClick={() => navigateChange('next')}
                disabled={currentIndex === changes.length - 1}
                className="p-2 rounded-full hover:bg-bone disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-bone mx-2" />

            {/* Accept/Reject */}
            <button
              onClick={handleReject}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate text-slate text-sm hover:bg-bone transition-colors"
            >
              <X className="w-4 h-4" />
              Reject All
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-canvas text-sm hover:bg-ink/90 transition-colors"
            >
              <Check className="w-4 h-4" weight="bold" />
              Accept All
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bone transition-colors ml-2"
            >
              <X className="w-5 h-5 text-slate" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar - File List */}
          <div className="w-72 bg-lifted border-r border-bone flex flex-col">
            <div className="px-4 py-3 border-b border-bone">
              <span className="text-xs font-700 uppercase tracking-wider text-slate">
                Files to Review
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {changes.map((change) => {
                const isSelected = selectedChangeId === change.id;
                const isAccepted = acceptedChanges.has(change.id);
                const isExpanded = expandedFiles.has(change.id);

                return (
                  <div key={change.id}>
                    <button
                      onClick={() => setSelectedChangeId(change.id)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left
                        transition-all duration-150
                        ${isSelected 
                          ? 'bg-white shadow-sm border border-bone' 
                          : 'hover:bg-white/50'
                        }
                      `}
                    >
                      {isAccepted ? (
                        <Check className="w-4 h-4 text-green-500" weight="bold" />
                      ) : (
                        <div className={`
                          w-4 h-4 rounded-full border-2
                          ${isSelected ? 'border-signal-light bg-signal-light/20' : 'border-slate'}
                        `} />
                      )}
                      <FileText className="w-4 h-4 text-slate" />
                      <span className="text-sm text-ink truncate flex-1">
                        {change.path.split('/').pop()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFile(change.id);
                        }}
                        className="p-1 rounded hover:bg-bone"
                      >
                        {isExpanded ? (
                          <CaretDown className="w-3 h-3 text-slate" />
                        ) : (
                          <CaretRight className="w-3 h-3 text-slate" />
                        )}
                      </button>
                    </button>

                    {isExpanded && (
                      <div className="ml-9 mt-1 space-y-1">
                        <p className="text-xs text-slate px-2 py-1">
                          {change.path}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Accept Selected Button */}
            {acceptedChanges.size > 0 && (
              <div className="p-3 border-t border-bone">
                <button
                  onClick={handleAcceptSelected}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-ink text-canvas text-sm hover:bg-ink/90 transition-colors"
                >
                  <Check className="w-4 h-4" weight="bold" />
                  Accept Selected ({acceptedChanges.size})
                </button>
              </div>
            )}
          </div>

          {/* Right Side - Diff View */}
          <div className="flex-1 flex flex-col min-h-0 bg-canvas">
            {/* File Header */}
            <div className="px-6 py-4 border-b border-bone flex items-center justify-between">
              <div>
                <h3 className="text-sm font-500 text-ink">{selectedChange.path}</h3>
                <p className="text-xs text-slate mt-0.5">
                  {getLanguage(selectedChange.path)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateChange('prev')}
                  disabled={currentIndex === 0}
                  className="px-3 py-1.5 rounded-full text-sm text-slate hover:bg-bone disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => navigateChange('next')}
                  disabled={currentIndex === changes.length - 1}
                  className="px-3 py-1.5 rounded-full text-sm text-slate hover:bg-bone disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
                <div className="h-4 w-px bg-bone mx-2" />
                <button
                  onClick={handleAcceptCurrent}
                  disabled={acceptedChanges.has(selectedChangeId)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors
                    ${acceptedChanges.has(selectedChangeId)
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-ink text-canvas hover:bg-ink/90'
                    }
                  `}
                >
                  {acceptedChanges.has(selectedChangeId) ? (
                    <>
                      <Check className="w-4 h-4" weight="bold" />
                      Accepted
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" weight="bold" />
                      Accept This
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Diff */}
            <div className="flex-1 p-4 min-h-0">
              <DiffView
                oldContent={selectedChange.oldContent}
                newContent={selectedChange.newContent}
                language={getLanguage(selectedChange.path)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-14 bg-lifted border-t border-bone flex items-center justify-between px-6">
          <p className="text-sm text-slate">
            Review each change carefully before accepting
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate">
              {acceptedChanges.size} of {changes.length} accepted
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
