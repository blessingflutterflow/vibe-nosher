import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { resolveSessionPath } from '@/lib/workspace';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, path } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    const fullPath = resolveSessionPath(sessionId, path);
    const stats = await stat(fullPath);

    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const content = await readFile(fullPath, 'utf-8');

    return NextResponse.json({ success: true, path, content, size: stats.size });
  } catch (error) {
    console.error('Read error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
