'use client';

import { useState, useRef } from 'react';

interface LogEvent {
  id: string;
  timestamp: string;
  type: string;
  raw: string;
  parsed?: unknown;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [message, setMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const sendRequest = async () => {
    if (!message.trim()) return;
    
    setIsStreaming(true);
    setLogs([]);
    
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, agent: 'base2' }),
        signal: abort.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            let parsed: unknown;
            try {
              parsed = JSON.parse(raw);
            } catch {
              parsed = { parseError: raw };
            }

            const eventType = typeof parsed === 'object' && parsed !== null 
              ? (parsed as Record<string, unknown>).type || 'unknown'
              : 'raw';

            setLogs(prev => [...prev, {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              timestamp: new Date().toISOString().split('T')[1].slice(0, 12),
              type: String(eventType),
              raw,
              parsed,
            }]);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setLogs(prev => [...prev, {
          id: `error-${Date.now()}`,
          timestamp: new Date().toISOString().split('T')[1].slice(0, 12),
          type: 'error',
          raw: String(err),
          parsed: { error: String(err) },
        }]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const clear = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 font-mono text-sm">
      <h1 className="text-xl mb-4">API Debug - Raw Events</h1>
      
      {/* Input */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isStreaming && sendRequest()}
          placeholder="Enter message..."
          className="flex-1 bg-gray-800 border border-gray-700 px-3 py-2 rounded"
          disabled={isStreaming}
        />
        <button
          onClick={isStreaming ? stop : sendRequest}
          className={`px-4 py-2 rounded ${isStreaming ? 'bg-red-600' : 'bg-blue-600'}`}
        >
          {isStreaming ? 'Stop' : 'Send'}
        </button>
        <button
          onClick={clear}
          className="px-4 py-2 rounded bg-gray-700"
        >
          Clear
        </button>
      </div>

      {/* Stats */}
      <div className="mb-2 text-gray-400">
        Events: {logs.length} | Streaming: {isStreaming ? 'YES' : 'NO'}
      </div>

      {/* Event Types Summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from(new Set(logs.map(l => l.type))).map(type => (
          <span key={type} className="px-2 py-1 bg-gray-800 rounded text-xs">
            {type}: {logs.filter(l => l.type === type).length}
          </span>
        ))}
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {logs.map((log, i) => (
          <div key={log.id} className="border border-gray-800 rounded overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 px-3 py-1 flex items-center gap-3 text-xs">
              <span className="text-gray-500">#{i + 1}</span>
              <span className="text-gray-400">{log.timestamp}</span>
              <span className={`px-2 py-0.5 rounded ${
                log.type === 'tool_call' ? 'bg-yellow-900' :
                log.type === 'tool_result' ? 'bg-green-900' :
                log.type === 'subagent_start' ? 'bg-blue-900' :
                log.type === 'subagent_finish' ? 'bg-purple-900' :
                log.type === 'text' ? 'bg-gray-700' :
                log.type === 'complete' ? 'bg-green-800' :
                log.type === 'error' ? 'bg-red-900' :
                'bg-gray-900'
              }`}>
                {log.type}
              </span>
            </div>
            
            {/* Raw JSON */}
            <div className="p-3 bg-gray-950">
              <div className="text-gray-500 text-xs mb-1">RAW:</div>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all overflow-x-auto">
                {log.raw}
              </pre>
            </div>

            {/* Parsed (if different) */}
            {log.parsed && (
              <div className="p-3 bg-gray-900 border-t border-gray-800">
                <div className="text-gray-500 text-xs mb-1">PARSED:</div>
                <pre className="text-xs text-green-300 whitespace-pre-wrap">
                  {JSON.stringify(log.parsed, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
