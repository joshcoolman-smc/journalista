# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (serves both frontend and backend on port 5000)
- `npm run build` - Build production bundle (client build + server bundle)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking

### Important Notes
- The app runs on a single port (5000) for both frontend and backend
- Port is configurable via PORT environment variable, defaults to 5000
- In development, Vite serves the frontend with HMR
- In production, Express serves static files

## Architecture Overview

### Core Structure
This is a **privacy-first journaling application** with local-first storage and optional GitHub sync:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript (minimal API server)
- **Storage**: Browser localStorage (primary) + GitHub API (optional backup)
- **Routing**: Wouter (lightweight React router)
- **UI**: Radix UI components with custom styling

### Key Architecture Principles
1. **Local-first**: All data stored in browser localStorage by default
2. **Privacy-focused**: No authentication, no user tracking, no data collection
3. **GitHub as backup**: Optional sync to private GitHub repository
4. **Stateless server**: Server only serves static files, no user data persistence

### Data Flow
1. User creates/edits journal entries → stored in localStorage
2. Auto-save triggers every second for active content
3. Optional GitHub sync pushes changes to user's private repository
4. Conflict resolution handles simultaneous edits between devices

## File Structure & Key Components

### Frontend (`client/src/`)
- `components/ZenJournal.tsx` - Main application component
- `components/EditorCanvas.tsx` - Markdown editor with 3 view modes (edit/split/preview)
- `components/Sidebar.tsx` - File management sidebar
- `components/GitHubConnection.tsx` - GitHub integration UI
- `components/AutoSaveIndicator.tsx` - Shows auto-save status
- `components/SyncIndicator.tsx` - Shows GitHub sync status
- `components/ConflictResolution.tsx` - GitHub conflict resolution dialog
- `components/DataManagement.tsx` - Export/clear data functions
- `components/MarkdownRenderer.tsx` - Renders markdown content
- `hooks/useFileStorage.ts` - Local file storage management
- `hooks/useGitHubSync.ts` - GitHub synchronization logic
- `hooks/useAutoSave.ts` - Auto-save functionality
- `services/fileStorage.ts` - localStorage abstraction
- `services/githubSync.ts` - GitHub API integration
- `types/journal.ts` - Core TypeScript definitions

### Backend (`server/`)
- `index.ts` - Express server setup with Vite integration
- `routes.ts` - API route definitions (minimal)
- `vite.ts` - Vite development server integration

## Key Features to Understand

### Storage Strategy
- **Primary**: localStorage for instant access and privacy
- **Secondary**: GitHub repository for backup and cross-device sync
- **No server storage**: User data never persists on the server

### GitHub Integration
- Creates private repositories automatically if they don't exist
- Stores entries in `entries/` directory as markdown files
- Handles conflict resolution for simultaneous edits
- Uses GitHub Personal Access Tokens (stored locally)

### Auto-save System
- Triggers every second for active content changes
- Visual indicators show save status
- Debounced to prevent excessive saves

### File Management
- Supports temporary file creation with deferred naming
- Markdown files with `.md` extension
- Deletion requires user confirmation
- Export functionality for data portability

## Development Workflow

### Running Tests
- No specific test framework configured - check if tests are added later
- Type checking with `npm run check`

### Building for Production
- `npm run build` creates optimized client build and server bundle
- Server bundle goes to `dist/` directory
- Static files served by Express in production


## Implementation Notes

### GitHub API Integration
- Client-side operations for privacy (no server-side GitHub access)
- Repository auto-creation if doesn't exist
- Conflict detection and manual resolution UI
- Files stored in `entries/` directory as `.md` files

### Security & Privacy
- Truly anonymous usage (no authentication/tracking)
- GitHub tokens stored in localStorage only
- All data stays client-side unless explicitly synced to GitHub

### UI/UX Patterns
- Minimal, distraction-free interface
- Three editor view modes: **edit** (markdown-only, default), **split** (side-by-side), **preview** (rendered-only)
- Clean header with view mode switchers (Code → Columns → Eye icons)
- Responsive design for mobile/desktop
- Custom CSS variables for theming (--zen-* pattern)
- Privacy-first design (no banners or tracking elements)

## Current View Mode Behavior
- **Default**: Markdown editor view for focused writing
- **Edit Mode**: Full-width markdown editor with word count
- **Split Mode**: Side-by-side markdown editor and live preview
- **Preview Mode**: Full-width rendered markdown view

## Planned Improvements

### GitHub Integration Refactor
See `github-integration-refactor.md` for comprehensive planned improvements:
- Simplified connection flow (token-only → repository picker)
- Repository browsing and switching capabilities
- Settings panel to replace header button clutter
- Local entry migration workflow for seamless GitHub adoption

## Recent Changes
- **2025-01**: Removed privacy notice banner for cleaner interface
- **2025-01**: Changed default view from split to markdown editor
- **2025-01**: Reordered view buttons to edit → split → preview

## Development Tips

### Key Patterns
- **CSS Variables**: Use `var(--zen-*)` for consistent theming
- **State Management**: React useState for local state, localStorage for persistence
- **File Naming**: Temporary files use `temp-` prefix, confirmed files get `.md` extension
- **Component Props**: TypeScript interfaces for all component props

### Common Tasks
- **View Mode Changes**: Edit `EditorCanvas.tsx` view mode logic
- **GitHub Integration**: Main logic in `services/githubSync.ts` 
- **File Operations**: Use `useFileStorage` hook for CRUD operations
- **Styling**: Components use inline styles with CSS variables for theme consistency

## AI-Assisted Development Workflow

This project uses a simple, git-based system for collaborative development between human and AI. The workflow is documented here for consistency and can be adopted by other projects.

### Core Workflow

1. **Check AI Progress First**: Always check `ai-progress/open/` for current feature documents before starting any work
2. **Feature Planning**: When user requests new features, create comprehensive specification documents in `ai-progress/open/`
3. **Implementation**: Use documents in `ai-progress/open/` as detailed specifications for implementation
4. **Completion**: Move finished features from `ai-progress/open/` to `ai-progress/closed/`
5. **Status Tracking**: Update document status throughout the process (Planning → Ready for Implementation → In Progress → Completed)

### AI Assistant Guidelines

**When user asks for new features:**
- Create or collaborate on detailed specification documents
- Place in `ai-progress/open/` with appropriate status
- Include technical implementation details, user stories, and acceptance criteria

**When user asks "what's outstanding?":**
- List contents of `ai-progress/open/` with current status
- Provide brief summary of each open item

**When user asks "what's been done?":**
- List contents of `ai-progress/closed/`
- Reference recent commits and completed features

**Before implementing anything:**
- Check `ai-progress/open/` for relevant specifications
- Use existing documents as implementation guides
- Update status as work progresses

**Proactive suggestions:**
- Based on `ai-progress/open/` contents, suggest logical next steps
- Identify dependencies between open features
- Recommend prioritization based on technical complexity

### Benefits of This System

- **Version Controlled**: All project planning tracked in git with code
- **Self-Documenting**: Clear history of features and decisions
- **Tool-Free**: No external project management tools required
- **Collaborative**: Easy handoffs between planning and implementation
- **Transparent**: Open source projects can see development process
- **Flexible**: Works for any project size or complexity

This approach provides structured project management while maintaining the simplicity and transparency that makes open source development effective.