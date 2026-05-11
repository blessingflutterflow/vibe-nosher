import { NextRequest } from 'next/server';
import { CodebuffClient } from '@codebuff/sdk';
import { getSessionWorkspace, loadRunState, saveRunState } from '@/lib/workspace';

const CODEBUFF_API_KEY = process.env.CODEBUFF_API_KEY || 'cb-pat-3aadf648d886f133d7c1e7ece920dcb68c85a11c229eca7e1d0e65c883afe0c9';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, agent = 'base2' } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create (or retrieve) the session workspace folder
    const cwd = await getSessionWorkspace(sessionId);

    // Load the conversation notebook from the previous turn (undefined = first message)
    const previousRun = await loadRunState(sessionId);

    const enhancedMessage = `${message}

[WORKSPACE]
Your working directory is: ${cwd}
You have full access to create files, folders, and run terminal commands here.
Use run_terminal_command for npm, npx, git, etc.
All file paths you use should be relative (e.g. src/app/page.tsx).
This workspace persists across the session — build real, complete projects here.`;

    const client = new CodebuffClient({
      apiKey: CODEBUFF_API_KEY,
      cwd,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            // client disconnected
          }
        };

        try {
          const result = await client.run({
            agent,
            prompt: enhancedMessage,
            previousRun,
            handleEvent: async (event) => {
              // Skip 'text' events — handleStreamChunk already streams
              // the same content in real time, forwarding both causes duplication
              if (event.type === 'text') return;
              send(event);
            },
            handleStreamChunk: (chunk) => {
              // Forward raw streaming chunks so client sees agent thinking in real time
              if (typeof chunk === 'string') {
                send({ type: 'stream_chunk', chunk });
              } else if (chunk.type === 'subagent_chunk') {
                send({ type: 'stream_chunk', agentId: chunk.agentId, chunk: chunk.chunk });
              }
            },
          });

          // Save the conversation notebook for the next turn
          await saveRunState(sessionId, result);

          const creditsUsed = result.sessionState?.mainAgentState?.creditsUsed ?? 0;
          const contextTokens = result.sessionState?.mainAgentState?.contextTokenCount ?? 0;

          send({ type: 'complete', creditsUsed, contextTokens });
          controller.close();
        } catch (error) {
          send({ type: 'error', message: String(error) });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
