'use client';

import { useEffect, useState } from 'react';
import { 
  Question, 
  ChartBar, 
  Plus, 
  Terminal, 
  ClockCounterClockwise,
  Palette,
  type Icon
} from '@phosphor-icons/react';

export interface SlashCommand {
  id: string;
  command: string;
  description: string;
  icon: Icon;
}

const slashCommands: SlashCommand[] = [
  { id: 'help', command: '/help', description: 'Show keyboard shortcuts and tips', icon: Question },
  { id: 'usage', command: '/usage', description: 'Show credits and usage stats', icon: ChartBar },
  { id: 'new', command: '/new', description: 'Start a new conversation', icon: Plus },
  { id: 'bash', command: '/bash', description: 'Enter bash mode', icon: Terminal },
  { id: 'history', command: '/history', description: 'Browse past conversations', icon: ClockCounterClockwise },
  { id: 'theme', command: '/theme', description: 'Toggle light/dark mode', icon: Palette },
];

interface SlashCommandMenuProps {
  searchTerm: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ searchTerm, onSelect, onClose }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  if (filteredCommands.length === 0) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-elevated border border-bone p-4">
        <p className="text-sm text-slate">No commands found</p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-elevated border border-bone overflow-hidden">
      <div className="px-3 py-2 border-b border-bone bg-lifted">
        <span className="text-xs font-700 uppercase tracking-wider text-slate">
          Commands
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {filteredCommands.map((cmd, index) => {
          const Icon = cmd.icon;
          const isSelected = index === selectedIndex;

          return (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left
                transition-colors duration-150
                ${isSelected ? 'bg-lifted' : 'hover:bg-bone'}
              `}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${isSelected ? 'bg-ink text-canvas' : 'bg-bone text-slate'}
              `}>
                <Icon className="w-4 h-4" weight={isSelected ? 'fill' : 'regular'} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-500 text-ink">{cmd.command}</p>
                <p className="text-xs text-slate">{cmd.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
