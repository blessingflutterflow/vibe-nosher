'use client';

import { useState, useEffect, useCallback } from 'react';
import { Folder, FolderOpen, FileText, ArrowClockwise } from '@phosphor-icons/react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

interface FileTreeProps {
  sessionId: string;
  refreshKey: number;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
}

async function listDir(sessionId: string, path: string): Promise<FileNode[]> {
  const res = await fetch('/api/fs/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, path }),
  });
  const data = await res.json();
  return data.success ? data.files : [];
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  const colors: Record<string, string> = {
    ts: 'text-blue-400', tsx: 'text-blue-400',
    js: 'text-yellow-400', jsx: 'text-yellow-400',
    json: 'text-yellow-300', css: 'text-pink-400',
    md: 'text-slate', html: 'text-orange-400',
  };
  return <FileText className={`w-4 h-4 flex-shrink-0 ${colors[ext ?? ''] ?? 'text-slate'}`} />;
}

function TreeNode({
  node,
  depth,
  sessionId,
  selectedFile,
  onFileSelect,
}: {
  node: FileNode;
  depth: number;
  sessionId: string;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const [children, setChildren] = useState<FileNode[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (node.type === 'file') {
      onFileSelect(node.path);
      return;
    }
    if (!loaded) {
      setLoading(true);
      const items = await listDir(sessionId, node.path);
      setChildren(items);
      setLoaded(true);
      setLoading(false);
    }
    setIsOpen((o) => !o);
  }, [node, loaded, sessionId, onFileSelect]);

  const isSelected = selectedFile === node.path;

  return (
    <div>
      <button
        onClick={toggle}
        className={`w-full flex items-center gap-2 py-1.5 pr-3 text-sm rounded-lg transition-colors text-left
          ${isSelected ? 'bg-ink/10 text-ink font-500' : 'text-granite hover:bg-bone'}`}
        style={{ paddingLeft: `${10 + depth * 14}px` }}
      >
        {node.type === 'directory' ? (
          isOpen
            ? <FolderOpen weight="fill" className="w-4 h-4 flex-shrink-0 text-signal-light" />
            : <Folder weight="fill" className="w-4 h-4 flex-shrink-0 text-slate" />
        ) : (
          <FileIcon name={node.name} />
        )}
        <span className="truncate">{node.name}</span>
        {loading && <span className="ml-auto text-xs text-slate animate-pulse">…</span>}
      </button>

      {node.type === 'directory' && isOpen && loaded && (
        <div>
          {children.length === 0 ? (
            <p className="text-xs text-slate py-1" style={{ paddingLeft: `${24 + depth * 14}px` }}>
              empty
            </p>
          ) : (
            children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                sessionId={sessionId}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function FileTree({ sessionId, refreshKey, onFileSelect, selectedFile }: FileTreeProps) {
  const [roots, setRoots] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const fetchRoot = useCallback(async () => {
    setLoading(true);
    const items = await listDir(sessionId, '.');
    setRoots(items);
    setEmpty(items.length === 0);
    setLoading(false);
  }, [sessionId]);

  // Fetch on mount and whenever AI finishes (refreshKey bumps)
  useEffect(() => {
    fetchRoot();
  }, [fetchRoot, refreshKey]);

  return (
    <div className="h-full bg-lifted rounded-2xl flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-bone flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-light" />
          <span className="text-xs font-700 uppercase tracking-wider text-slate">Explorer</span>
        </div>
        <button
          onClick={fetchRoot}
          className="p-1 rounded hover:bg-bone transition-colors"
          title="Refresh"
        >
          <ArrowClockwise className={`w-3.5 h-3.5 text-slate ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {loading && roots.length === 0 ? (
          <p className="text-xs text-slate px-3 py-4 text-center animate-pulse">Loading…</p>
        ) : empty ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-slate">Workspace is empty</p>
            <p className="text-xs text-slate/60 mt-1">Ask the AI to build something</p>
          </div>
        ) : (
          roots.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              sessionId={sessionId}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
