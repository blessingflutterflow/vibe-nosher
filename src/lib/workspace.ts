import { mkdir, readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { RunState } from '@codebuff/sdk';

const STATE_FILE = '.vibe-state.json';

const WORKSPACE_ROOT = join(process.cwd(), 'workspace', 'sessions');

export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT;
}

// Creates the session folder if it doesn't exist, returns its absolute path
export async function getSessionWorkspace(sessionId: string): Promise<string> {
  if (!sessionId || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    throw new Error('Invalid sessionId');
  }
  const sessionPath = join(WORKSPACE_ROOT, sessionId);
  await mkdir(sessionPath, { recursive: true });
  return sessionPath;
}

// Saves RunState (the conversation notebook) after each AI run
export async function saveRunState(sessionId: string, state: RunState): Promise<void> {
  const sessionPath = await getSessionWorkspace(sessionId);
  await writeFile(join(sessionPath, STATE_FILE), JSON.stringify(state), 'utf-8');
}

// Loads RunState from the previous run — returns undefined if first message ever
export async function loadRunState(sessionId: string): Promise<RunState | undefined> {
  try {
    const sessionPath = await getSessionWorkspace(sessionId);
    const raw = await readFile(join(sessionPath, STATE_FILE), 'utf-8');
    return JSON.parse(raw) as RunState;
  } catch {
    return undefined;
  }
}

// Resolves a relative path inside a session workspace safely
// Throws if the resolved path escapes the session folder (path traversal guard)
export function resolveSessionPath(sessionId: string, relativePath: string = '.'): string {
  if (!sessionId || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    throw new Error('Invalid sessionId');
  }
  const sessionRoot = join(WORKSPACE_ROOT, sessionId);
  const full = resolve(sessionRoot, relativePath);
  if (!full.startsWith(sessionRoot)) {
    throw new Error('Path traversal detected');
  }
  return full;
}
