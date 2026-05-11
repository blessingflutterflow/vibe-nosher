'use client';

import { Robot, Check, CircleNotch, X } from '@phosphor-icons/react';

interface AgentTask {
  id: string;
  name: string;
  status: string;
  description?: string;
}

interface SpawnAgentsResultProps {
  agents: AgentTask[];
  onAgentClick?: (agentId: string) => void;
}

export function SpawnAgentsResult({ agents, onAgentClick }: SpawnAgentsResultProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-slate" />;
      case 'running':
        return <CircleNotch className="w-4 h-4 text-signal-light animate-spin" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" weight="bold" />;
      case 'error':
        return <X className="w-4 h-4 text-signal" weight="bold" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-slate" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-slate';
      case 'running':
        return 'text-signal-light';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-signal';
      default:
        return 'text-slate';
    }
  };

  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="bg-lifted rounded-2xl border border-bone overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-bone">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-light" />
          <span className="text-xs font-700 uppercase tracking-wider text-slate">
            Spawned Agents
          </span>
        </div>
      </div>

      {/* Agents */}
      <div className="divide-y divide-bone">
        {agents.map((agent, index) => (
          <button
            key={`${agent.id}-${index}`}
            onClick={() => onAgentClick?.(agent.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white transition-colors text-left"
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${agent.status === 'running' ? 'bg-signal-light/20' : 'bg-bone'}
            `}>
              <Robot className="w-4 h-4 text-signal-light" weight="fill" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-500 text-ink truncate">
                {agent.name}
              </p>
              {agent.description && (
                <p className="text-xs text-slate truncate">
                  {agent.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-500 capitalize ${getStatusColor(agent.status)}`}>
                {agent.status}
              </span>
              {getStatusIcon(agent.status)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
