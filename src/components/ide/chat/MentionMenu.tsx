'use client';

import { useEffect, useState } from 'react';
import { Robot, Folder, FileText } from '@phosphor-icons/react';

export interface MentionItem {
  id: string;
  name: string;
  type: 'agent' | 'file' | 'folder';
  description?: string;
}

const agents: MentionItem[] = [
  { id: 'file-picker', name: 'file-picker', type: 'agent', description: 'Finds relevant files in the codebase' },
  { id: 'editor', name: 'editor', type: 'agent', description: 'Edits code files' },
  { id: 'reviewer', name: 'reviewer', type: 'agent', description: 'Reviews code changes' },
  { id: 'basher', name: 'basher', type: 'agent', description: 'Runs terminal commands' },
  { id: 'code-searcher', name: 'code-searcher', type: 'agent', description: 'Searches code with ripgrep' },
];

const files: MentionItem[] = [
  { id: 'package.json', name: 'package.json', type: 'file' },
  { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file' },
  { id: 'README.md', name: 'README.md', type: 'file' },
  { id: 'src/app/page.tsx', name: 'src/app/page.tsx', type: 'file' },
  { id: 'src/app/layout.tsx', name: 'src/app/layout.tsx', type: 'file' },
  { id: 'src/app/ide/page.tsx', name: 'src/app/ide/page.tsx', type: 'file' },
  { id: 'src', name: 'src', type: 'folder' },
  { id: 'src/app', name: 'src/app', type: 'folder' },
  { id: 'src/components', name: 'src/components', type: 'folder' },
];

interface MentionMenuProps {
  searchTerm: string;
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
}

export function MentionMenu({ searchTerm, onSelect, onClose }: MentionMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'agents' | 'files'>('agents');

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allItems = activeTab === 'agents' ? filteredAgents : filteredFiles;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActiveTab(prev => prev === 'agents' ? 'files' : 'agents');
        setSelectedIndex(0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          onSelect(allItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allItems, selectedIndex, activeTab, onSelect, onClose]);

  const getIcon = (item: MentionItem) => {
    switch (item.type) {
      case 'agent':
        return <Robot className="w-4 h-4" weight="fill" />;
      case 'folder':
        return <Folder className="w-4 h-4" weight="fill" />;
      case 'file':
        return <FileText className="w-4 h-4" weight="regular" />;
    }
  };

  const getIconBg = (item: MentionItem, isSelected: boolean) => {
    if (isSelected) return 'bg-ink text-canvas';
    
    switch (item.type) {
      case 'agent':
        return 'bg-signal-light/20 text-signal-light';
      case 'folder':
        return 'bg-bone text-granite';
      case 'file':
        return 'bg-bone text-slate';
    }
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-elevated border border-bone overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-bone">
        <button
          onClick={() => { setActiveTab('agents'); setSelectedIndex(0); }}
          className={`
            flex-1 px-4 py-2 text-sm font-500 transition-colors
            ${activeTab === 'agents' ? 'bg-lifted text-ink' : 'text-slate hover:bg-bone'}
          `}
        >
          Agents ({filteredAgents.length})
        </button>
        <button
          onClick={() => { setActiveTab('files'); setSelectedIndex(0); }}
          className={`
            flex-1 px-4 py-2 text-sm font-500 transition-colors
            ${activeTab === 'files' ? 'bg-lifted text-ink' : 'text-slate hover:bg-bone'}
          `}
        >
          Files ({filteredFiles.length})
        </button>
      </div>

      {/* Items */}
      <div className="max-h-64 overflow-y-auto py-1">
        {allItems.length === 0 ? (
          <div className="px-4 py-3 text-sm text-slate">
            No {activeTab} found
          </div>
        ) : (
          allItems.map((item, index) => {
            const isSelected = index === selectedIndex;

            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left
                  transition-colors duration-150
                  ${isSelected ? 'bg-lifted' : 'hover:bg-bone'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${getIconBg(item, isSelected)}
                `}>
                  {getIcon(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500 text-ink truncate">@{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-slate truncate">{item.description}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-bone bg-lifted text-xs text-slate flex items-center justify-between">
        <span>↑↓ Navigate</span>
        <span>Tab Switch • Enter Select</span>
      </div>
    </div>
  );
}
