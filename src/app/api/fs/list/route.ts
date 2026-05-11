import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { getSessionWorkspace, resolveSessionPath } from '@/lib/workspace';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, path = '.' } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Ensure session workspace exists before listing
    await getSessionWorkspace(sessionId);
    const fullPath = resolveSessionPath(sessionId, path);
    const entries = await readdir(fullPath, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules')
        .map(async (entry) => {
          const entryFull = join(fullPath, entry.name);
          const stats = await stat(entryFull);
          return {
            name: entry.name,
            path: join(path, entry.name).replace(/\\/g, '/'),
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime.toISOString(),
          };
        })
    );

    // Directories first, then files — alphabetical within each group
    files.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ success: true, path, files });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
