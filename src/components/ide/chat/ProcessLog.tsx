'use client';

import { useState } from 'react';
import { Robot, FileText, Pencil, Terminal, MagnifyingGlass, Folder, CircleNotch, Check, CaretDown, CaretRight } from '@phosphor-icons/react';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'agent_start' | 'agent_finish' | 'tool_call' | 'tool_result' | 'text' | 'thinking';
  agentName?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  content?: string;
  status?: 'pending' | 'running' | 'success' | 'error';
}

interface ProcessLogProps {
  entries: LogEntry[];
}

const TOOL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  write_file:           { label: 'Writing file',        icon: <Pencil className="w-3 h-3" /> },
  str_replace:          { label: 'Editing file',        icon: <Pencil className="w-3 h-3" /> },
  read_files:           { label: 'Reading files',       icon: <FileText className="w-3 h-3" /> },
  read_subtree:         { label: 'Exploring directory', icon: <Folder className="w-3 h-3" /> },
  run_terminal_command: { label: 'Running command',     icon: <Terminal className="w-3 h-3" /> },
  code_search:          { label: 'Searching code',      icon: <MagnifyingGlass className="w-3 h-3" /> },
  spawn_agents:         { label: 'Spawning agents',     icon: <Robot className="w-3 h-3" /> },
  spawn_agent_inline:   { label: 'Spawning agent',      icon: <Robot className="w-3 h-3" /> },
};

function toolMeta(name?: string) {
  if (!name) return { label: 'Tool', icon: <Terminal className="w-3 h-3" /> };
  return TOOL_LABELS[name] ?? { label: name, icon: <Terminal className="w-3 h-3" /> };
}

interface AgentBlock {
  name: string;
  done: boolean;
  tools: LogEntry[];
}

function buildBlocks(entries: LogEntry[]): AgentBlock[] {
  const blocks: AgentBlock[] = [];
  let current: AgentBlock | null = null;

  for (const entry of entries) {
    if (entry.type === 'agent_start') {
      current = { name: entry.agentName ?? 'Agent', done: false, tools: [] };
      blocks.push(current);
    } else if (entry.type === 'agent_finish') {
      if (current) current.done = true;
    } else if (entry.type === 'tool_call') {
      if (current) current.tools.push(entry);
    }
  }

  return blocks;
}

function buildSummary(blocks: AgentBlock[], isRunning: boolean): string {
  if (isRunning) {
    const current = [...blocks].reverse().find(b => !b.done);
    return current ? `${current.name} is working…` : 'Working…';
  }
  const agentCount = blocks.length;
  const toolCount = blocks.reduce((sum, b) => sum + b.tools.length, 0);
  if (agentCount === 0) return 'Done';
  return `${agentCount} agent${agentCount > 1 ? 's' : ''} · ${toolCount} action${toolCount !== 1 ? 's' : ''}`;
}

export function ProcessLog({ entries }: ProcessLogProps) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  const blocks = buildBlocks(entries);
  const isRunning = entries.some(e => e.status === 'running') || blocks.some(b => !b.done);
  const summary = buildSummary(blocks, isRunning);

  return (
    <div className="my-2 animate-fade-in">
      {/* Collapsed pill — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bone hover:bg-bone/80 transition-colors"
      >
        {isRunning
          ? <CircleNotch className="w-3.5 h-3.5 text-signal-light animate-spin flex-shrink-0" />
          : <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" weight="bold" />
        }
        <span className="text-xs text-slate">{summary}</span>
        {expanded
          ? <CaretDown className="w-3 h-3 text-slate ml-1" />
          : <CaretRight className="w-3 h-3 text-slate ml-1" />
        }
      </button>

      {/* Expanded detail */}
      {expanded && blocks.length > 0 && (
        <div className="mt-2 ml-2 space-y-2 animate-fade-in">
          {blocks.map((block, i) => (
            <div key={i} className="flex gap-2">
              {/* Spine */}
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${block.done ? 'bg-green-100' : 'bg-signal-light/15'}`}>
                  {block.done
                    ? <Check className="w-2.5 h-2.5 text-green-600" weight="bold" />
                    : <CircleNotch className="w-2.5 h-2.5 text-signal-light animate-spin" />
                  }
                </div>
                {block.tools.length > 0 && <div className="w-px flex-1 bg-bone mt-1" />}
              </div>

              {/* Block content */}
              <div className="flex-1 pb-1">
                <p className="text-xs font-500 text-ink leading-4">{block.name}</p>
                {block.tools.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {block.tools.map(tool => {
                      const meta = toolMeta(tool.toolName);
                      // For terminal commands, show the actual command
                      const detail = tool.toolName === 'run_terminal_command' && tool.toolInput?.command
                        ? String(tool.toolInput.command).slice(0, 48)
                        : tool.toolName === 'write_file' && tool.toolInput?.path
                        ? String(tool.toolInput.path).split('/').pop()
                        : tool.toolName === 'str_replace' && tool.toolInput?.path
                        ? String(tool.toolInput.path).split('/').pop()
                        : null;
                      return (
                        <div key={tool.id} className="flex items-center gap-1.5 text-slate/70">
                          {meta.icon}
                          <span className="text-xs">{meta.label}</span>
                          {detail && (
                            <span className="text-xs font-mono text-slate/50 truncate max-w-[160px]">{detail}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
