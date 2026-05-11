'use client';

import { useState, useRef, useCallback } from 'react';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { SlashCommandMenu, SlashCommand } from './SlashCommandMenu';
import { MentionMenu, MentionItem } from './MentionMenu';

interface ChatInputProps {
  onSend: (message: string) => void;
}

type MenuType = 'slash' | 'mention' | null;

export function ChatInput({ onSend }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [menuType, setMenuType] = useState<MenuType>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setInput(value);

    // Check for slash command
    if (value === '/') {
      setMenuType('slash');
      setSearchTerm('');
      return;
    }

    // Check for mention
    if (value === '@') {
      setMenuType('mention');
      setSearchTerm('');
      return;
    }

    // Check if we're in a command/mention context
    const beforeCursor = value.slice(0, cursorPosition);
    const lastSlash = beforeCursor.lastIndexOf('/');
    const lastAt = beforeCursor.lastIndexOf('@');
    const lastSpace = beforeCursor.lastIndexOf(' ');

    // If we have a slash after the last space
    if (lastSlash > lastSpace && (lastAt === -1 || lastSlash > lastAt)) {
      const afterSlash = beforeCursor.slice(lastSlash + 1);
      // Only show if it's at the start or after space, and before cursor
      if (!afterSlash.includes(' ')) {
        setMenuType('slash');
        setSearchTerm(afterSlash);
        return;
      }
    }

    // If we have an @ after the last space
    if (lastAt > lastSpace && (lastSlash === -1 || lastAt > lastSlash)) {
      const afterAt = beforeCursor.slice(lastAt + 1);
      // Only show if it's at the start or after space, and before cursor
      if (!afterAt.includes(' ')) {
        setMenuType('mention');
        setSearchTerm(afterAt);
        return;
      }
    }

    setMenuType(null);
    setSearchTerm('');

    // Auto-resize
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  }, []);

  const insertCommand = useCallback((command: SlashCommand) => {
    const beforeSlash = input.slice(0, input.lastIndexOf('/'));
    const newValue = beforeSlash + command.command + ' ';
    setInput(newValue);
    setMenuType(null);
    textareaRef.current?.focus();
    
    // Handle command execution
    if (command.id === 'new') {
      // Trigger new conversation
      onSend('/new');
      setInput('');
    } else if (command.id === 'bash') {
      // Switch to bash mode
      setInput('!');
    }
  }, [input, onSend]);

  const insertMention = useCallback((item: MentionItem) => {
    const beforeAt = input.slice(0, input.lastIndexOf('@'));
    const afterCursor = input.slice(input.length); // Get text after cursor if any
    const newValue = beforeAt + '@' + item.name + ' ' + afterCursor;
    setInput(newValue);
    setMenuType(null);
    textareaRef.current?.focus();
  }, [input]);

  const handleSubmit = useCallback(() => {
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
      setMenuType(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Don't submit if menu is open (let menu handle Enter)
    if (menuType && e.key === 'Enter') {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setMenuType(null);
    }
  }, [menuType, handleSubmit]);

  const closeMenu = useCallback(() => {
    setMenuType(null);
  }, []);

  return (
    <div className="relative">
      {/* Menu */}
      {menuType === 'slash' && (
        <SlashCommandMenu
          searchTerm={searchTerm}
          onSelect={insertCommand}
          onClose={closeMenu}
        />
      )}
      {menuType === 'mention' && (
        <MentionMenu
          searchTerm={searchTerm}
          onSelect={insertMention}
          onClose={closeMenu}
        />
      )}

      {/* Input */}
      <div className="relative bg-white rounded-3xl border border-bone focus-within:border-ink/30 transition-colors shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to edit code... Type / for commands or @ for agents/files"
          className="w-full px-5 py-4 pr-14 bg-transparent rounded-3xl text-sm resize-none outline-none min-h-[56px] max-h-[120px] font-sans"
          rows={1}
          spellCheck={false}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className={`
            absolute right-3 top-1/2 -translate-y-1/2
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-200
            ${input.trim()
              ? 'bg-ink text-canvas hover:scale-105'
              : 'bg-bone text-slate'
            }
          `}
        >
          <PaperPlaneRight weight="fill" className="w-5 h-5" />
        </button>
      </div>

      {/* Hint */}
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate">
        <span>Enter to send</span>
        <span className="w-1 h-1 rounded-full bg-slate/50" />
        <span>Shift+Enter for new line</span>
        <span className="w-1 h-1 rounded-full bg-slate/50" />
        <span>/ for commands</span>
        <span className="w-1 h-1 rounded-full bg-slate/50" />
        <span>@ for agents/files</span>
      </div>
    </div>
  );
}
