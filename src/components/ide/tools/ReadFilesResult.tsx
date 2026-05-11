'use client';

import { FileText, Copy, Check } from '@phosphor-icons/react';
import { useState } from 'react';

interface FileContent {
  path: string;
  content: string;
  language?: string;
}

interface ReadFilesResultProps {
  files: FileContent[];
  onFileClick?: (path: string) => void;
}

export function ReadFilesResult({ files, onFileClick }: ReadFilesResultProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopy = async (content: string, path: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const getLanguage = (path: string | undefined): string => {
    if (!path) return 'text';
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
      'rs': 'rust',
      'go': 'go',
    };
    return langMap[ext || ''] || 'text';
  };

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-bone">
        <p className="text-sm text-slate">No files to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div 
          key={file.path}
          className="bg-white rounded-2xl border border-bone overflow-hidden shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-lifted border-b border-bone">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-signal-light" />
              <span 
                className="text-sm font-500 text-ink cursor-pointer hover:underline"
                onClick={() => onFileClick?.(file.path)}
              >
                {file.path}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate uppercase">{getLanguage(file.path)}</span>
              <button
                onClick={() => handleCopy(file.content, file.path)}
                className="p-1.5 rounded-md hover:bg-bone transition-colors"
                title="Copy content"
              >
                {copiedPath === file.path ? (
                  <Check className="w-4 h-4 text-green-500" weight="bold" />
                ) : (
                  <Copy className="w-4 h-4 text-slate" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-x-auto">
            <pre className="text-xs font-mono leading-relaxed text-ink whitespace-pre">
              {file.content}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
