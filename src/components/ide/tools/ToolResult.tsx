'use client';

import { ReadFilesResult } from './ReadFilesResult';
import { StrReplaceResult } from './StrReplaceResult';
import { SpawnAgentsResult } from './SpawnAgentsResult';
import { BashResult } from './BashResult';

export type ToolName = 'read_files' | 'str_replace' | 'spawn_agents' | 'spawn_agent_inline' | 'set_messages' | 'run_terminal_command' | string;

interface ToolResultProps {
  toolName: ToolName;
  result: unknown;
  onAcceptChanges?: () => void;
  onRejectChanges?: () => void;
  onFileClick?: (path: string) => void;
  onAgentClick?: (agentId: string) => void;
}

export function ToolResult({ 
  toolName, 
  result, 
  onAcceptChanges, 
  onRejectChanges,
  onFileClick,
  onAgentClick,
}: ToolResultProps) {
  // Handle read_files — SDK can return several shapes, normalise all of them
  if (toolName === 'read_files' && Array.isArray(result)) {
    const files = result
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') return null;
        const obj = item as Record<string, unknown>;

        // Shape 1: { path, content } — what we expect
        if (typeof obj.path === 'string') {
          return { path: obj.path, content: String(obj.content ?? '') };
        }
        // Shape 2: { type: 'json', value: { path, content } }
        if (obj.type === 'json' && obj.value && typeof obj.value === 'object') {
          const v = obj.value as Record<string, unknown>;
          if (typeof v.path === 'string') {
            return { path: v.path, content: String(v.content ?? '') };
          }
        }
        // Shape 3: { type: 'text', text: '...' } — plain text blob, no path
        if (obj.type === 'text' && typeof obj.text === 'string') {
          return { path: 'output', content: obj.text };
        }
        return null;
      })
      .filter(Boolean) as { path: string; content: string }[];

    if (files.length === 0) return null;
    return <ReadFilesResult files={files} onFileClick={onFileClick} />;
  }

  // Handle str_replace — SDK result only contains a success message,
  // old/new strings are in the tool call input (not available here).
  // Show a simple "file edited" chip instead of trying to render a diff.
  if (toolName === 'str_replace') {
    let path = '';
    if (Array.isArray(result)) {
      for (const item of result as Array<Record<string, unknown>>) {
        if (item.type === 'json' && item.value && typeof item.value === 'object') {
          const v = item.value as Record<string, unknown>;
          path = String(v.path ?? v.file ?? '');
        }
      }
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-lifted rounded-xl border border-bone">
        <span className="text-xs text-signal-light">✎</span>
        <span className="text-sm text-ink">
          {path ? `Edited ${path.split('/').pop()}` : 'File edited'}
        </span>
        {path && <span className="text-xs text-slate truncate max-w-[200px]">{path}</span>}
      </div>
    );
  }

  // Handle spawn_agents and spawn_agent_inline
  if ((toolName === 'spawn_agents' || toolName === 'spawn_agent_inline') && Array.isArray(result)) {
    // Check if it's a generic response format
    if (result.length === 1 && result[0]?.type === 'json' && result[0]?.value?.message) {
      // Simple success message
      return (
        <div className="bg-lifted rounded-xl p-3 border border-bone">
          <span className="text-sm text-ink">✓ {result[0].value.message}</span>
        </div>
      );
    }
    
    const agents = result.map((item: { id: string; name: string; status: string; description?: string }) => ({
      id: item.id || `agent-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || 'Unknown Agent',
      status: item.status || 'completed',
      description: item.description,
    }));
    return <SpawnAgentsResult agents={agents} onAgentClick={onAgentClick} />;
  }

  // Handle set_messages
  if (toolName === 'set_messages' && Array.isArray(result)) {
    if (result.length === 1 && result[0]?.type === 'json' && result[0]?.value?.message) {
      return (
        <div className="bg-lifted rounded-xl p-3 border border-bone">
          <span className="text-sm text-ink">✓ {result[0].value.message}</span>
        </div>
      );
    }
  }

  // Handle run_terminal_command — SDK returns ToolResultOutput[]
  if (toolName === 'run_terminal_command') {
    let command = '';
    let output = '';
    let exitCode = 0;

    if (Array.isArray(result)) {
      for (const item of result as Array<Record<string, unknown>>) {
        if (item.type === 'text' && typeof item.text === 'string') {
          output += item.text;
        } else if (item.type === 'json' && item.value && typeof item.value === 'object') {
          const v = item.value as Record<string, unknown>;
          command = String(v.command ?? v.cmd ?? '');
          output = String(v.stdout ?? v.output ?? v.text ?? output);
          exitCode = Number(v.exitCode ?? v.exit_code ?? 0);
        }
      }
    } else if (result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      command = String(r.command ?? '');
      output = String(r.output ?? r.stdout ?? '');
      exitCode = Number(r.exitCode ?? 0);
    }

    return <BashResult command={command} output={output} exitCode={exitCode} />;
  }

  // Generic fallback - check for common response formats
  if (Array.isArray(result) && result.length === 1 && result[0]?.type === 'json') {
    return (
      <div className="bg-white rounded-2xl p-4 border border-bone">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-bone rounded-full text-xs text-slate uppercase">
            {toolName}
          </span>
        </div>
        <p className="text-sm text-ink">
          {result[0].value?.message || JSON.stringify(result[0].value, null, 2)}
        </p>
      </div>
    );
  }

  // Generic fallback
  return (
    <div className="bg-white rounded-2xl p-4 border border-bone">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-bone rounded-full text-xs text-slate uppercase">
          {toolName}
        </span>
      </div>
      <pre className="text-xs font-mono text-ink overflow-x-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
