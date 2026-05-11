'use client';

import { useState } from 'react';
import { Header } from './Header';
import { NavPill } from './NavPill';
import { FileTree } from './FileTree';
import { ChatPanel } from './ChatPanel';
import { EditorPanel } from './EditorPanel';
import { StatusBar } from './StatusBar';
import { HelpModal } from './HelpModal';
import { DiagnosticPanel } from './DiagnosticPanel';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function IDELayout() {
  const [activeTab, setActiveTab] = useState<'files' | 'chat' | 'settings'>('chat');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Stable session ID for the lifetime of this page load
  const [sessionId] = useState<string>(() => crypto.randomUUID());

  const handleFilesChanged = () => setFileRefreshKey((k) => k + 1);

  useKeyboardShortcuts({
    onFocusChat: () => setActiveTab('chat'),
    onNewChat: () => console.log('New chat'),
    onToggleTheme: toggleTheme,
    onEscape: () => setIsHelpOpen(false),
  });

  return (
    <div className="flex flex-col h-screen bg-canvas">
      <Header
        projectName="vibe-coder"
        mode="DEFAULT"
        credits={1000}
        onDiagnostics={() => setIsDiagnosticOpen(true)}
      />

      <div className="flex justify-center py-3">
        <NavPill
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onShowHelp={() => setIsHelpOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>

      <div className="flex-1 flex gap-3 px-4 pb-3 min-h-0">
        {/* Left — File Tree */}
        <div className="w-64 flex-shrink-0">
          <FileTree
            sessionId={sessionId}
            refreshKey={fileRefreshKey}
            onFileSelect={(path) => {
              setSelectedFile(path);
              setActiveTab('files');
            }}
            selectedFile={selectedFile}
          />
        </div>

        {/* Center — Chat */}
        <div className="flex-1 min-w-0">
          <ChatPanel
            sessionId={sessionId}
            onFilesChanged={handleFilesChanged}
          />
        </div>

        {/* Right — Editor */}
        <div className="w-[480px] flex-shrink-0">
          <EditorPanel
            sessionId={sessionId}
            selectedFile={selectedFile}
          />
        </div>
      </div>

      <StatusBar
        status="Ready"
        model="anthropic/claude-opus-4"
        tokens={45000}
        credits={1000}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <DiagnosticPanel
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
}
