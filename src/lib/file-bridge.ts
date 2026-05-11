// File Bridge - Intercepts agent tool calls and executes locally

export interface FileOperation {
  toolName: string;
  input: unknown;
}

export async function executeLocalTool(toolName: string, input: unknown): Promise<unknown> {
  console.log(`[FileBridge] Executing ${toolName} locally`, input);
  
  switch (toolName) {
    case 'write_file':
      return handleWriteFile(input as { path: string; content: string });
    
    case 'read_files':
      return handleReadFiles(input as { paths: string[] });
    
    case 'read_subtree':
      return handleReadSubtree(input as { paths?: string[]; maxTokens?: number });
    
    default:
      // Not a file operation, let cloud handle it
      return null;
  }
}

async function handleWriteFile(input: { path: string; content: string }) {
  const response = await fetch('/api/fs/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  // Return format expected by agent
  return [{
    type: 'json',
    value: {
      message: `File written: ${input.path}`,
      path: input.path,
    }
  }];
}

async function handleReadFiles(input: { paths: string[] }) {
  const files = await Promise.all(
    input.paths.map(async (path) => {
      const response = await fetch('/api/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        return {
          path,
          content: `Error: ${result.error}`,
        };
      }
      
      return {
        path,
        content: result.content,
      };
    })
  );
  
  return files;
}

async function handleReadSubtree(input: { paths?: string[]; maxTokens?: number }) {
  const paths = input.paths || ['.'];
  
  const results = await Promise.all(
    paths.map(async (path) => {
      const response = await fetch('/api/fs/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        return {
          path,
          type: 'directory',
          error: result.error,
        };
      }
      
      // Format as tree structure
      const tree = formatAsTree(result.files);
      
      return {
        path,
        type: 'directory',
        printedTree: tree,
        tokenCount: 0, // Would calculate properly
        truncationLevel: 0,
      };
    })
  );
  
  return results;
}

function formatAsTree(files: Array<{ name: string; type: string }>): string {
  return files
    .map(f => f.type === 'directory' ? `📁 ${f.name}/` : `📄 ${f.name}`)
    .join('\n');
}
