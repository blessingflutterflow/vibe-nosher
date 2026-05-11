import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { path, content } = await request.json();
    
    if (!path || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Path and content are required' },
        { status: 400 }
      );
    }

    // Security: Ensure path is within project directory
    const projectRoot = process.cwd();
    const fullPath = `${projectRoot}/${path}`;
    
    // Create directory if it doesn't exist
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    
    // Write file
    await writeFile(fullPath, content, 'utf-8');
    
    return NextResponse.json({ 
      success: true, 
      path,
      message: `File written: ${path}`
    });
  } catch (error) {
    console.error('Write file error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
