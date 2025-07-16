# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (serves both frontend and backend on port 5000)
- `npm run build` - Build production bundle (client build + server bundle)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes (Drizzle)

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
- **Database**: PostgreSQL with Drizzle ORM (currently minimal usage)
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
- `components/EditorCanvas.tsx` - Markdown editor with live preview
- `components/Sidebar.tsx` - File management sidebar
- `components/GitHubConnection.tsx` - GitHub integration UI
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

### Shared (`shared/`)
- `schema.ts` - Database schema definitions (Drizzle)

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

### Database Usage
- Database schema exists but is minimally used
- Currently focused on client-side storage
- Use `npm run db:push` if schema changes are needed

## Important Implementation Details

### GitHub API Integration
- All GitHub operations happen client-side for privacy
- Base64 encoding for file content uploads
- Proper error handling for API rate limits
- Repository auto-creation with proper permissions

### Conflict Resolution
- Detects conflicts when pulling from GitHub
- Provides UI for manual conflict resolution
- Maintains file history through Git

### Security Considerations
- No authentication system - truly anonymous usage
- GitHub tokens stored in localStorage only
- All API calls use HTTPS
- No server-side user data storage

### UI/UX Patterns
- Minimal, distraction-free interface
- Split view for markdown editing and preview
- Responsive design for mobile/desktop
- Custom CSS variables for theming