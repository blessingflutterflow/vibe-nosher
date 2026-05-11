'use client';

import { useState, useRef, useCallback } from 'react';
import { Robot, User, Wrench } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatInput } from './chat/ChatInput';
import { ToolResult, ToolName } from './tools/ToolResult';
import { ErrorBoundary } from './ErrorBoundary';
import { streamChat, type StreamEvent } from '@/lib/codebuff-client';
import { ProcessLog, type LogEntry } from './chat/ProcessLog';

interface ToolCall {
  id: string;
  toolName: ToolName;
  result: unknown;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  usage?: { credits: number; tokens: number; elapsed: number };
}

interface ChatPanelProps {
  sessionId: string;
  onFilesChanged: () => void;
}

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm VibeCoder. Tell me what to build and I'll write the code, run the commands, and create the files — all in your session workspace. Try: \"Create a Next.js todo app\"",
  timestamp: new Date(),
};

function stripThinkTags(text: string): string {
  // Remove complete <think>...</think> blocks
  let out = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove an in-progress think block (streaming — no closing tag yet)
  out = out.replace(/<think>[\s\S]*/gi, '');
  return out.trim();
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-bone rounded-xl text-xs text-slate">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-ink' : 'bg-signal-light/20'}`}>
        {isUser ? (
          <User weight="fill" className="w-4 h-4 text-canvas" />
        ) : hasToolCalls ? (
          <Wrench weight="fill" className="w-4 h-4 text-signal-light" />
        ) : (
          <Robot weight="fill" className="w-4 h-4 text-signal-light" />
        )}
      </div>

      <div className="max-w-[90%] space-y-3">
        <div className={`px-4 py-3 rounded-3xl text-sm leading-relaxed ${isUser ? 'bg-lifted text-ink rounded-br-md' : 'bg-white text-ink rounded-bl-md shadow-sm'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-');
                return isBlock ? (
                  <pre className="bg-editor-bg text-canvas rounded-xl p-3 overflow-x-auto text-xs font-mono my-2">
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code className="bg-bone px-1.5 py-0.5 rounded text-xs font-mono text-ink">{children}</code>
                );
              },
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => <strong className="font-600">{children}</strong>,
              a: ({ href, children }) => <a href={href} className="text-link underline" target="_blank" rel="noreferrer">{children}</a>,
            }}
          >
            {stripThinkTags(message.content)}
          </ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block ml-1 animate-pulse">▋</span>
          )}
        </div>

        {/* Usage + timer chips — shown after streaming completes */}
        {!isUser && !message.isStreaming && message.usage && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs text-slate/60 bg-bone px-2 py-0.5 rounded-full">
              ⏱ {message.usage.elapsed >= 60
                ? `${Math.floor(message.usage.elapsed / 60)}m ${message.usage.elapsed % 60}s`
                : `${message.usage.elapsed}s`}
            </span>
            {message.usage.credits > 0 && (
              <span className="text-xs text-slate/60 bg-bone px-2 py-0.5 rounded-full">
                {message.usage.credits} credits
              </span>
            )}
            {message.usage.tokens > 0 && (
              <span className="text-xs text-slate/60 bg-bone px-2 py-0.5 rounded-full">
                {message.usage.tokens >= 1000
                  ? `${(message.usage.tokens / 1000).toFixed(1)}k`
                  : message.usage.tokens} tokens
              </span>
            )}
          </div>
        )}

        {hasToolCalls && (
          <div className="space-y-2">
            {message.toolCalls
              ?.filter(tc => ['write_file', 'str_replace', 'run_terminal_command'].includes(tc.toolName))
              .map((tc) => (
                <ErrorBoundary key={tc.id}>
                  <ToolResult toolName={tc.toolName} result={tc.result} />
                </ErrorBoundary>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({ sessionId, onFilesChanged }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [processLog, setProcessLog] = useState<LogEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setProcessLog((prev) => [
      ...prev,
      { ...entry, id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now() },
    ]);
  }, []);

  // These are Codebuff's internal orchestration tools — never show them to the user
  const INTERNAL_TOOLS = new Set([
    'write_todos', 'set_output', 'suggest_followups',
    'set_messages', 'write_todos_to_checklist',
  ]);

  const friendlyAgentName = (displayName?: string, agentType?: string): string => {
    if (displayName) return displayName;
    const type = agentType?.split('/').pop() ?? '';
    const names: Record<string, string> = {
      'base2': 'Orchestrator', 'base': 'Orchestrator',
      'context-pruner': 'Context Pruner', 'file-picker': 'File Picker',
      'editor': 'Editor', 'reviewer': 'Reviewer',
    };
    return names[type] || type || 'Agent';
  };

  const handleSend = useCallback(async (content: string) => {
    if (isStreaming) return;

    const isFirstMessage = messages.length === 1 && messages[0].id === 'welcome';
    const history = isFirstMessage ? [] : messages;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      toolCalls: [],
    };

    setMessages([...history, userMsg, assistantMsg]);
    setIsStreaming(true);
    setProcessLog([]);
    startTimeRef.current = Date.now();

    try {
      const chatHistory = history.map((m) => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content });

      const stream = streamChat(chatHistory, { sessionId });

      let currentContent = '';
      let currentToolCalls: ToolCall[] = [];

      for await (const event of stream) {
        switch (event.type) {
          case 'message':
            currentContent += event.content ?? '';
            setMessages((prev) =>
              prev.map((m) => m.id === assistantMsg.id ? { ...m, content: currentContent } : m)
            );
            break;

          case 'tool_call':
            if (INTERNAL_TOOLS.has(event.toolName ?? '')) break;
            addLog({ type: 'tool_call', toolName: event.toolName, toolInput: event.data as Record<string, unknown>, status: 'running' });
            break;

          case 'tool_result':
            if (INTERNAL_TOOLS.has(event.toolName ?? '')) break;
            addLog({ type: 'tool_result', toolName: event.toolName, content: 'Done', status: 'success' });
            if (event.toolName && event.result !== undefined) {
              currentToolCalls = [
                ...currentToolCalls,
                { id: `tc-${Date.now()}-${currentToolCalls.length}`, toolName: event.toolName as ToolName, result: event.result },
              ];
              setMessages((prev) =>
                prev.map((m) => m.id === assistantMsg.id ? { ...m, toolCalls: currentToolCalls } : m)
              );
            }
            break;

          case 'subagent_start':
            addLog({ type: 'agent_start', agentName: friendlyAgentName(event.displayName, event.agentType), status: 'running' });
            break;

          case 'subagent_finish':
            addLog({ type: 'agent_finish', agentName: friendlyAgentName(event.displayName, event.agentType), status: 'success' });
            break;

          case 'complete': {
            const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
            setMessages((prev) =>
              prev.map((m) => m.id === assistantMsg.id ? {
                ...m,
                isStreaming: false,
                usage: { credits: event.creditsUsed ?? 0, tokens: event.contextTokens ?? 0, elapsed },
              } : m)
            );
            onFilesChanged();
            break;
          }

          case 'error':
            setMessages((prev) =>
              prev.map((m) => m.id === assistantMsg.id ? { ...m, content: `Error: ${event.error}`, isStreaming: false } : m)
            );
            break;
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) => m.id === assistantMsg.id ? { ...m, content: 'Connection failed. Check the console.', isStreaming: false } : m)
      );
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, sessionId, onFilesChanged, addLog]);

  return (
    <div className="h-full bg-canvas rounded-3xl flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-bone flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-light" />
          <span className="text-xs font-700 uppercase tracking-wider text-slate">Conversation</span>
        </div>
        <button
          onClick={() => { setMessages([welcomeMessage]); setProcessLog([]); }}
          className="text-xs text-slate hover:text-ink transition-colors"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
        {isStreaming && processLog.length > 0 && <ProcessLog entries={processLog} />}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
}
