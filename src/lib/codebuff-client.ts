export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamEvent {
  type: 'message' | 'tool_call' | 'tool_result' | 'subagent_start' | 'subagent_finish' | 'error' | 'complete';
  content?: string;
  toolName?: string;
  data?: unknown;
  result?: unknown;
  error?: string;
  agentId?: string;
  agentType?: string;
  displayName?: string;
  creditsUsed?: number;
  contextTokens?: number;
}

export async function* streamChat(
  messages: ChatMessage[],
  options: {
    agent?: string;
    sessionId: string;
  }
): AsyncGenerator<StreamEvent, void, unknown> {
  const { agent = 'base2', sessionId } = options;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: messages[messages.length - 1]?.content,
      sessionId,
      agent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    yield { type: 'error', error };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', error: 'No response body' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));

        if (data.type === 'stream_chunk') {
          // Real-time streaming chunk from agent
          yield { type: 'message', content: data.chunk ?? '' };
        } else if (data.type === 'text') {
          // Complete text event (fallback)
          yield { type: 'message', content: data.text };
        } else if (data.type === 'tool_call') {
          yield { type: 'tool_call', toolName: data.toolName, data: data.input };
        } else if (data.type === 'tool_result') {
          yield { type: 'tool_result', toolName: data.toolName, result: data.output ?? data.result };
        } else if (data.type === 'subagent_start') {
          yield { type: 'subagent_start', agentId: data.agentId, agentType: data.agentType, displayName: data.displayName };
        } else if (data.type === 'subagent_finish') {
          yield { type: 'subagent_finish', agentId: data.agentId };
        } else if (data.type === 'complete') {
          yield { type: 'complete', creditsUsed: data.creditsUsed, contextTokens: data.contextTokens };
        } else if (data.type === 'error') {
          yield { type: 'error', error: data.message ?? data.error };
        }
      } catch {
        // malformed SSE line, skip
      }
    }
  }
}
