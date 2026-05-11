'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileCode, X } from '@phosphor-icons/react';

interface EditorPanelProps {
  sessionId: string;
  selectedFile: string | null;
}

const LANG_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript',
  json: 'json', css: 'css',
  html: 'html', md: 'markdown',
  py: 'python', sh: 'shell',
  yml: 'yaml', yaml: 'yaml',
};

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return LANG_MAP[ext] ?? 'plaintext';
}

export function EditorPanel({ sessionId, selectedFile }: EditorPanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setContent(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch('/api/fs/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, path: selectedFile }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setContent(data.content);
        } else {
          setError(data.error ?? 'Failed to read file');
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [selectedFile, sessionId]);

  const fileName = selectedFile?.split('/').pop() ?? '';

  return (
    <div className="h-full bg-editor-bg rounded-2xl flex flex-col overflow-hidden" style={{ borderRadius: '32px 0 0 32px' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-editor-surface min-h-[44px]">
        {selectedFile ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-editor-active rounded-md text-sm">
            <FileCode className="w-4 h-4 text-signal-light" />
            <span className="text-canvas/90 font-500">{fileName}</span>
            <button
              onClick={() => setContent(null)}
              className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/10 ml-1"
            >
              <X className="w-3 h-3 text-canvas/50" />
            </button>
          </div>
        ) : (
          <span className="px-3 py-1.5 text-sm text-slate">No file selected</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {!selectedFile && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileCode className="w-12 h-12 mx-auto mb-3 text-slate/30" />
              <p className="text-sm text-slate">Select a file from the explorer</p>
            </div>
          </div>
        )}

        {selectedFile && loading && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-slate animate-pulse">Loading…</p>
          </div>
        )}

        {selectedFile && error && (
          <div className="h-full flex items-center justify-center px-6">
            <p className="text-sm text-signal text-center">{error}</p>
          </div>
        )}

        {selectedFile && !loading && content !== null && (
          <Editor
            height="100%"
            language={getLanguage(selectedFile)}
            value={content}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              readOnly: true,
              automaticLayout: true,
              padding: { top: 16 },
            }}
          />
        )}
      </div>
    </div>
  );
}
