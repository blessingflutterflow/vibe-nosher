import { NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { CodebuffClient } from '@codebuff/sdk';
import { getSessionWorkspace } from '@/lib/workspace';

const CODEBUFF_API_KEY = process.env.CODEBUFF_API_KEY || 'cb-pat-3aadf648d886f133d7c1e7ece920dcb68c85a11c229eca7e1d0e65c883afe0c9';

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

async function checkWorkspaceCreation(): Promise<CheckResult> {
  try {
    const path = await getSessionWorkspace('__health_check__');
    return { name: 'Workspace creation', ok: true, detail: path };
  } catch (e) {
    return { name: 'Workspace creation', ok: false, detail: String(e) };
  }
}

async function checkFileWriteRead(): Promise<CheckResult> {
  try {
    const sessionPath = await getSessionWorkspace('__health_check__');
    const testFile = join(sessionPath, '_test.txt');
    await writeFile(testFile, 'ok', 'utf-8');
    const content = await readFile(testFile, 'utf-8');
    await unlink(testFile);
    if (content !== 'ok') throw new Error('Content mismatch');
    return { name: 'File write & read', ok: true, detail: 'Wrote and read _test.txt' };
  } catch (e) {
    return { name: 'File write & read', ok: false, detail: String(e) };
  }
}

async function checkFsListRoute(): Promise<CheckResult> {
  try {
    const res = await fetch('http://localhost:3000/api/fs/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: '__health_check__', path: '.' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error ?? `HTTP ${res.status}`);
    return { name: 'FS list API', ok: true, detail: `${data.files.length} items in workspace` };
  } catch (e) {
    return { name: 'FS list API', ok: false, detail: String(e) };
  }
}

async function checkApiKey(): Promise<CheckResult> {
  const key = process.env.CODEBUFF_API_KEY;
  if (key) {
    return { name: 'API key (env)', ok: true, detail: 'CODEBUFF_API_KEY is set in environment' };
  }
  return { name: 'API key (env)', ok: false, detail: 'Using hardcoded fallback — add CODEBUFF_API_KEY to .env.local' };
}

async function checkConversationMemory(): Promise<CheckResult> {
  try {
    const { saveRunState, loadRunState } = await import('@/lib/workspace');
    const testId = '__health_check__';
    const fakeState = { output: { type: 'lastMessage', value: [] }, sessionState: undefined } as any;
    await saveRunState(testId, fakeState);
    const loaded = await loadRunState(testId);
    if (!loaded) throw new Error('Loaded state was undefined');
    return { name: 'Conversation memory', ok: true, detail: 'RunState saves and loads correctly' };
  } catch (e) {
    return { name: 'Conversation memory', ok: false, detail: String(e) };
  }
}

async function checkCodebuffConnectivity(): Promise<CheckResult> {
  try {
    const client = new CodebuffClient({ apiKey: CODEBUFF_API_KEY });
    const connected = await client.checkConnection();
    if (!connected) throw new Error('Healthz returned not-ok');
    return { name: 'Codebuff API', ok: true, detail: 'Connected to Codebuff cloud' };
  } catch (e) {
    return { name: 'Codebuff API', ok: false, detail: String(e) };
  }
}

export async function GET() {
  const results = await Promise.allSettled([
    checkWorkspaceCreation(),
    checkFileWriteRead(),
    checkFsListRoute(),
    checkApiKey(),
    checkConversationMemory(),
    checkCodebuffConnectivity(),
  ]);

  const checks: CheckResult[] = results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { name: 'Unknown', ok: false, detail: String(r.reason) }
  );

  const allOk = checks.every((c) => c.ok);

  return NextResponse.json({ ok: allOk, checks });
}
