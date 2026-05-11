# VibeCoder Web IDE

A web-based IDE powered by Codebuff's multi-agent system, replicating the terminal workflow with a Mastercard-inspired design system.

## Features

- **3-Panel Layout**: File Tree (left) + Chat (center) + Monaco Editor (right)
- **Multi-Agent Chat**: Real Codebuff agents spawn file-picker, editor, reviewer
- **Tool Results**: View read_files, str_replace diffs, terminal output inline
- **Slash Commands**: Type `/` for help, new chat, theme toggle
- **@ Mentions**: Reference agents (@file-picker) and files (@src/app/page.tsx)
- **Review Screen**: Side-by-side diff with accept/reject
- **Keyboard Shortcuts**: Cmd+K focus, Cmd+Shift+N new chat, Cmd+Shift+T theme
- **Mastercard Design**: Warm cream palette, rounded corners, pill buttons

## Quick Start

```bash
npm run dev
```

Open `http://localhost:3000/ide`

## API Setup

The frontend connects to Codebuff's API using your API key.

**Current setup**: API key is hardcoded in `src/lib/codebuff-client.ts` for testing.

**For production**, create `.env.local`:
```
CODEBUFF_API_KEY=your_api_key_here
```

## Architecture

- **Frontend**: Next.js 16, React 19, Tailwind v4, Monaco Editor
- **Design**: Mastercard palette (#F3F0EE cream, #CF4500 signal orange)
- **Backend**: Codebuff SDK (`@codebuff/sdk`) for multi-agent orchestration
- **Fonts**: Sofia Sans (UI), JetBrains Mono (code)
- **Icons**: Phosphor Icons

## File Structure

```
src/
  app/ide/page.tsx           # IDE main page
  components/ide/
    IDELayout.tsx            # 3-panel layout shell
    Header.tsx               # Top bar (mode, credits)
    NavPill.tsx              # Floating nav with tabs
    FileTree.tsx             # Collapsible file explorer
    ChatPanel.tsx            # Chat with streaming
    EditorPanel.tsx          # Monaco editor
    StatusBar.tsx            # Bottom status bar
    ReviewScreen.tsx         # Diff review modal
    HelpModal.tsx            # Keyboard shortcuts
    chat/
      ChatInput.tsx          # Input with / and @
      SlashCommandMenu.tsx   # / command popup
      MentionMenu.tsx        # @ mention popup
    tools/
      ToolResult.tsx         # Generic tool result
      ReadFilesResult.tsx    # File content viewer
      StrReplaceResult.tsx   # Diff viewer
      SpawnAgentsResult.tsx  # Agent status cards
      BashResult.tsx         # Terminal output
  hooks/
    useTheme.ts              # Light/dark theme
    useKeyboardShortcuts.ts  # Global shortcuts
    useStreamingText.ts      # Text animation
  lib/
    codebuff-client.ts       # SDK integration
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus chat input |
| `Cmd/Ctrl + Shift + N` | New conversation |
| `Cmd/Ctrl + Shift + T` | Toggle theme |
| `Cmd/Ctrl + Y` | Accept changes (in review) |
| `Cmd/Ctrl + N` | Reject changes (in review) |
| `Enter` | Send message |
| `Shift + Enter` | New line in input |
| `Escape` | Close modals |
| `↑ / ↓` | Navigate chat history |
| `/` | Show slash commands |
| `@` | Show agents/files |

## Validation Checklist

- [ ] Open `/ide` - layout renders
- [ ] Type message - real API responds (uses 20-50 credits)
- [ ] Agent spawns file-picker - see tool result in chat
- [ ] Click file in tree - opens in Monaco editor
- [ ] Agent proposes changes - diff shows with accept/reject
- [ ] `/help` - shows keyboard shortcuts
- [ ] `@file-picker` - mention agent
- [ ] `Cmd+Shift+T` - toggle theme

## Roadmap

**Phase 1-8: ✅ Complete**
- Layout shell, chat, file tree, editor
- Tool results, review screen
- Polish: shortcuts, theme, help

**Phase 9: 🔄 In Progress**
- API integration with Codebuff SDK

**Phase 10: 📋 Planned**
- Self-hosted backend (port agent-runtime)
- Local file system integration
- Git integration

## Credits

- Multi-agent system: [Codebuff](https://codebuff.com)
- Design inspiration: Mastercard brand guidelines
- Icons: [Phosphor Icons](https://phosphoricons.com)
