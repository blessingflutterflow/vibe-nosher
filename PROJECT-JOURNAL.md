# VibeCoder Project Journal

## How It Started

The journey began with a simple question: *"How do we replicate Codebuff's multi-agent orchestration in a web IDE?"*

Codebuff (the CLI tool) had something special - it wasn't just a chatbot. It was a **swarm of specialized agents** working together:
- **Context Pruner** - Analyzes and filters context
- **File Picker** - Selects relevant files
- **Editor** - Makes code changes
- **Base2** - Orchestrates everything

The CLI version worked perfectly. Files were written locally. Multiple agents collaborated. But we wanted this power in a **web interface** - something with Monaco editor, file tree, real-time streaming, and that 3-panel IDE vibe.

## The Research Phase

### Codebuff Source Code Analysis

We obtained the Codebuff source code (`codebuff-research/` directory) and studied:

```
codebuff-research/
├── packages/
│   ├── agent-runtime/     # Core orchestration engine
│   ├── bridge/            # Tool execution bridge
│   └── mcp/               # Model Context Protocol
├── cli/                   # Terminal UI (Ink + React)
└── agents/                # Agent definitions
    ├── base2/
    ├── context-pruner/
    ├── file-picker/
    └── editor/
```

**Key Discovery:** The magic is in `agent-runtime` - it spawns subagents, streams events, handles tool calls, and manages the conversation flow.

### Architecture Decisions

1. **Frontend:** Next.js + TypeScript + Tailwind + Monaco Editor + Phosphor Icons
2. **Backend:** Next.js API Routes (serverless functions)
3. **Agent Runtime:** Initially tried to use `@codebuff/sdk` directly
4. **File System:** Local bridge pattern (execute file operations on host machine)

## The Build

### Phase 1: UI Shell (Complete ✅)

Created the 3-panel IDE layout:
- **Left:** File tree (with Monaco integration)
- **Middle:** Chat panel with streaming messages
- **Right:** Monaco editor with tabs
- **Header:** Project info, connection status
- **Status Bar:** Credits, model info

### Phase 2: API Integration (Complete ✅)

**Challenge:** Codebuff SDK uses WASM modules that don't bundle well with Next.js.

**Solution:** 
- Use SDK only in server-side API routes
- Client talks to local API (`/api/chat`)
- API proxies to Codebuff cloud

```
Browser (React) → /api/chat (Next.js) → Codebuff Cloud API → Agents
```

### Phase 3: File Bridge (Complete ✅)

**The Problem:** Agents run in Codebuff's cloud, but we want files on OUR machine.

**The Solution:** Intercept file tool calls and execute locally:

```javascript
// When agent calls "write_file"
handleEvent: async (event) => {
  if (event.toolName === 'write_file') {
    // Execute on local filesystem instead of cloud
    await fs.writeFile(`./${event.input.path}`, event.input.content);
    
    // Return result to agent as if cloud did it
    return { output: [{ type: 'json', value: { message: 'File written' }}] };
  }
}
```

File tools intercepted:
- `write_file` → Writes to `./output/` or specified path
- `read_files` → Reads from local project
- `read_subtree` → Lists local directories

### Phase 4: Streaming & Events (Complete ✅)

**Challenge:** Codebuff streams Server-Sent Events (SSE). We need to:
1. Parse SSE on backend
2. Forward to frontend as SSE
3. Parse in client and update React state

**Event Types Handled:**
- `start` - Agent initialized
- `subagent_start` - Child agent spawned
- `subagent_finish` - Child agent completed
- `tool_call` - Tool execution started
- `tool_result` - Tool execution completed
- `text` - Streaming text content
- `complete` - Everything done
- `error` - Something broke

### Phase 5: Verbose Process Log (Complete ✅)

Added a terminal-style process log showing:
```
🤖 Context Pruner started...
📁 read_files src/app/page.tsx... (spinning)
✓ Completed
🤖 Editor spawned...
✏️ write_file index.html... (spinning)
✓ File written: index.html
💬 Here's the complete website...
```

### Phase 6: Debug Tools (Complete ✅)

Created `/debug` page for raw API inspection:
- Shows every event with timestamp
- RAW JSON vs Parsed view
- Event type counters
- Start/Stop streaming controls

## Where We're At

### What's Working:

1. ✅ **File Bridge** - Agents write files to local machine
2. ✅ **Multi-Agent Streaming** - See all agents working in real-time
3. ✅ **Tool Cards** - Visual display of tool calls (read_files, write_file, etc.)
4. ✅ **Monaco Editor** - Syntax highlighting, multiple tabs
5. ✅ **Keyboard Shortcuts** - Help modal, theme toggle
6. ✅ **Debug Page** - Raw event inspection
7. ✅ **Project Context** - Agent knows where to write files

### File Structure:

```
vibe-coder/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts      # Main chat API with file bridge
│   │   │   └── fs/                # File system API routes
│   │   │       ├── write/route.ts
│   │   │       ├── read/route.ts
│   │   │       └── list/route.ts
│   │   ├── ide/page.tsx           # IDE main page
│   │   └── debug/page.tsx         # Debug/event inspector
│   ├── components/
│   │   └── ide/
│   │       ├── ChatPanel.tsx      # Chat with process log
│   │       ├── IDELayout.tsx      # 3-panel layout
│   │       ├── EditorPanel.tsx    # Monaco editor
│   │       ├── FileTree.tsx       # File explorer
│   │       └── chat/
│   │           ├── ProcessLog.tsx # Terminal-style event log
│   │           └── ChatInput.tsx  # Input with slash commands
│   └── lib/
│       ├── codebuff-client.ts     # Client-side event streaming
│       └── file-bridge.ts         # File operation helpers
├── package.json
├── next.config.ts
└── .env.local                     # Codebuff API key
```

### Current Behavior:

1. User types: *"Create simple HTML page"*
2. System auto-adds context: *"Current working directory: C:\...\vibe-coder"*
3. API hits Codebuff with streaming
4. Backend intercepts file operations, executes locally
5. Frontend shows process log in real-time
6. File appears in `./output/` (or specified folder)
7. Website is ready to open in browser

## The Action vs Chat Philosophy

**Codebuff is an ACTION agent, not a chatbot.**

When you say "create HTML page":
- ❌ NOT: "Sure! I'll help you with that. Let me think..."
- ✅ IS: (immediately) Context Pruner → File Picker → Editor → Files written

This is intentional. For coding:
- No conversational fluff
- Direct results
- See the work happening via process log

**Options for adding "chat" layer:**
1. Add fake "thinking" messages while agents work
2. Wrap with conversational AI layer before hitting Codebuff
3. Keep action-only (current) - most efficient for coding

## Where We're Headed

### Immediate (Validation Phase):

1. 🔄 **Test file bridge** - Verify files write to correct locations
2. 🔄 **Refine tool cards** - Better display for different tool results
3. 🔄 **Error handling** - Graceful failures, retry logic
4. 🔄 **Credits management** - Show remaining API credits

### Short-Term (Productize):

1. 📋 **Project templates** - Start from React, Next.js, etc. templates
2. 📋 **Version control** - Git integration for agent changes
3. 📋 **Review flow** - Accept/reject changes before writing
4. 📋 **File watcher** - Auto-refresh file tree when agents write

### Long-Term (Self-Host):

1. 🏗️ **Port agent-runtime** - Run agents locally without Codebuff cloud
2. 🏗️ **Custom agents** - Add specialized agents for specific frameworks
3. 🏗️ **VPS deployment** - Full web IDE hosted on your server
4. 🏗️ **Team collaboration** - Multi-user, shared projects

### The Vision:

A **web-based IDE** where:
- AI agents work alongside you
- Every action is transparent (see the process log)
- Files are written locally (or to your VPS)
- Multi-agent orchestration handles complex tasks
- You remain in control (review changes, accept/reject)

**Not a chatbot that happens to code.**
**A coding IDE that happens to have AI agents.**

## Current Status: VALIDATION PHASE

We have 500 Codebuff API credits for testing. Each request costs ~1-50 credits depending on complexity.

**Working now:**
- Web IDE UI with 3 panels
- File bridge writing to local machine
- Process log showing agent activity
- Debug page for API inspection

**Test command:**
```bash
cd "vibe-coder"
npm run dev
# Open http://localhost:3000/ide
# Say: "Create a simple HTML landing page"
# Watch process log
# Check ./output/ folder
```

**Next decision:**
- Add conversational layer? (chatty AI)
- Keep action-only? (current - efficient)
- Start self-hosting work? (port agent-runtime)

---

*Project started: May 2026*
*Current checkpoint: File bridge working, agents writing locally*
*Next milestone: Validate with real projects, then self-host*
