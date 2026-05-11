'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onNewChat?: () => void;
  onFocusChat?: () => void;
  onToggleTheme?: () => void;
  onAcceptChanges?: () => void;
  onRejectChanges?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd/Ctrl + K: Focus chat input
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      shortcuts.onFocusChat?.();
    }

    // Cmd/Ctrl + Shift + N: New chat
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      shortcuts.onNewChat?.();
    }

    // Cmd/Ctrl + Shift + T: Toggle theme
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      shortcuts.onToggleTheme?.();
    }

    // Cmd/Ctrl + Y: Accept changes (when reviewing)
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
      e.preventDefault();
      shortcuts.onAcceptChanges?.();
    }

    // Cmd/Ctrl + N: Reject changes (when reviewing)
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      shortcuts.onRejectChanges?.();
    }

    // Escape: Close modals/clear selection
    if (e.key === 'Escape') {
      shortcuts.onEscape?.();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Hook specifically for chat input
export function useChatKeyboard(
  onSend: () => void,
  onCancel: () => void,
  isStreaming: boolean
) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter to send (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) {
        onSend();
      }
    }

    // Escape to cancel streaming
    if (e.key === 'Escape' && isStreaming) {
      e.preventDefault();
      onCancel();
    }
  }, [onSend, onCancel, isStreaming]);

  return { handleKeyDown };
}
