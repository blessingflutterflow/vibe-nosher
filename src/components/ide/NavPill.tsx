'use client';

import { Files, ChatText, Gear, Question, Sun, Moon } from '@phosphor-icons/react';

interface NavPillProps {
  activeTab: 'files' | 'chat' | 'settings';
  onTabChange: (tab: 'files' | 'chat' | 'settings') => void;
  onShowHelp?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function NavPill({ 
  activeTab, 
  onTabChange, 
  onShowHelp,
  theme = 'light',
  onToggleTheme 
}: NavPillProps) {
  const tabs = [
    { id: 'files' as const, label: 'Files', icon: Files },
    { id: 'chat' as const, label: 'Chat', icon: ChatText },
    { id: 'settings' as const, label: 'Settings', icon: Gear },
  ];

  return (
    <nav 
      className="inline-flex items-center gap-1 px-2 py-2 bg-white rounded-pill"
      style={{ boxShadow: 'var(--shadow-nav)' }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-500
              transition-all duration-200 ease-out
              ${isActive 
                ? 'bg-ink text-canvas' 
                : 'text-ink hover:bg-bone'
              }
            `}
          >
            <Icon weight={isActive ? 'fill' : 'regular'} className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}

      <div className="h-6 w-px bg-bone mx-1" />

      {/* Theme Toggle */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-full text-ink hover:bg-bone transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-signal-light" />
          )}
        </button>
      )}

      {/* Help Button */}
      {onShowHelp && (
        <button
          onClick={onShowHelp}
          className="p-2 rounded-full text-ink hover:bg-bone transition-colors"
          title="Keyboard shortcuts"
        >
          <Question className="w-4 h-4" weight="bold" />
        </button>
      )}
    </nav>
  );
}
