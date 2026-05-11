'use client';

import { X, Command, ArrowBendDownLeft, ArrowUp, ArrowDown, Sun, Moon, FileCode, Plus, Keyboard } from '@phosphor-icons/react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const keyboardShortcuts = [
  {
    category: 'Chat',
    shortcuts: [
      { key: 'Enter', description: 'Send message', icon: ArrowBendDownLeft },
      { key: 'Shift + Enter', description: 'New line' },
      { key: 'Escape', description: 'Cancel streaming' },
      { key: '↑ / ↓', description: 'Navigate history', icon: ArrowUp },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { key: 'Cmd + K', description: 'Focus chat input', icon: Command },
      { key: 'Cmd + Shift + N', description: 'New conversation', icon: Plus },
      { key: 'Cmd + Shift + T', description: 'Toggle theme', icon: Sun },
    ],
  },
  {
    category: 'Review',
    shortcuts: [
      { key: 'Cmd + Y', description: 'Accept changes' },
      { key: 'Cmd + N', description: 'Reject changes' },
    ],
  },
];

const slashCommands = [
  { command: '/help', description: 'Show this help dialog' },
  { command: '/new', description: 'Start new conversation' },
  { command: '/usage', description: 'Show credits and usage' },
  { command: '/bash', description: 'Enter bash mode' },
  { command: '/history', description: 'Browse past conversations' },
  { command: '/theme', description: 'Toggle light/dark mode' },
];

export function HelpModal({ isOpen, onClose, theme, onToggleTheme }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[80vh] bg-canvas rounded-3xl shadow-elevated overflow-hidden flex flex-col"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        {/* Header */}
        <header className="h-16 bg-lifted border-b border-bone flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-signal-light/20 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-signal-light" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-500 text-ink">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate">Master the VibeCoder workflow</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-bone hover:bg-bone transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 text-slate" />
                  <span className="text-sm text-ink">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-signal-light" />
                  <span className="text-sm text-ink">Light</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bone transition-colors"
            >
              <X className="w-5 h-5 text-slate" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Slash Commands */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-light" />
              <h3 className="text-sm font-700 uppercase tracking-wider text-slate">
                Slash Commands
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {slashCommands.map((cmd) => (
                <div 
                  key={cmd.command}
                  className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-bone"
                >
                  <code className="px-2 py-1 bg-bone rounded-lg text-sm font-mono text-ink">
                    {cmd.command}
                  </code>
                  <span className="text-sm text-slate">{cmd.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-6">
            {keyboardShortcuts.map((section) => (
              <div key={section.category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-light" />
                  <h3 className="text-sm font-700 uppercase tracking-wider text-slate">
                    {section.category}
                  </h3>
                </div>
                <div className="space-y-2">
                  {section.shortcuts.map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-bone"
                    >
                      <span className="text-sm text-ink">{shortcut.description}</span>
                      <div className="flex items-center gap-1.5">
                        {shortcut.key.split(' + ').map((part, i) => (
                          <kbd 
                            key={i}
                            className="px-2 py-1 bg-bone rounded-lg text-xs font-mono text-ink border border-bone"
                          >
                            {part}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-lifted rounded-2xl border border-bone">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-signal-light" />
              <div>
                <p className="text-sm font-500 text-ink">Pro Tip</p>
                <p className="text-xs text-slate mt-0.5">
                  Type <code className="px-1 py-0.5 bg-white rounded">@</code> to mention agents or files, 
                  or <code className="px-1 py-0.5 bg-white rounded">/</code> for slash commands
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-14 bg-lifted border-t border-bone flex items-center justify-center px-6">
          <p className="text-sm text-slate">
            Press <kbd className="px-2 py-0.5 bg-white rounded mx-1">Esc</kbd> to close
          </p>
        </footer>
      </div>
    </div>
  );
}
