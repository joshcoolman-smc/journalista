# Zen Journal Application

## Overview

Zen Journal is a minimalist markdown journaling application built with React, Express, and TypeScript. It provides a distraction-free writing experience with beautiful typography, dark mode theming, and seamless auto-save functionality. The application prioritizes simplicity and focus, offering a clean interface for markdown-based journaling.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 16, 2025
- **GitHub Integration**: Added comprehensive GitHub backup and sync functionality
  - OAuth-style personal access token authentication
  - Automatic repository creation if it doesn't exist
  - Dual storage system (localStorage + GitHub)
  - Background auto-sync with conflict resolution
  - Manual sync button and sync status indicators
- **Security Enhancements**: 
  - GitHub token validation with proper error handling
  - Privacy notice explaining local-first data model
  - Data export functionality (JSON format)
  - Clear all data option with confirmation dialog
- **Deployment Preparation**:
  - MIT license added
  - Comprehensive README with security model documentation
  - Enhanced error handling for public deployment
  - Accessibility improvements for dialog components
- **Previous Changes**: 
  - Default split view mode for optimal writing experience
  - Three view modes (Split, Markdown, Preview)
  - Enhanced markdown support and JetBrains Mono font integration

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom dark theme and CSS variables
- **Typography**: Google Fonts (Inter for UI, Crimson Text for content, JetBrains Mono for code)
- **State Management**: React hooks with Context API for global state
- **Data Fetching**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Management**: PostgreSQL sessions with connect-pg-simple
- **Development**: Hot reload with Vite integration

### File Structure
```
/client          - React frontend application
/server          - Express backend API
/shared          - Shared types and schemas
/attached_assets - Design and requirements documents
```

## Key Components

### Core Frontend Components
1. **ZenJournal** - Main application container managing state and layout
2. **Sidebar** - File browser with search, create, and delete functionality
3. **EditorCanvas** - Markdown editor with preview mode and file management
4. **MarkdownRenderer** - Custom lightweight markdown parser and renderer
5. **AutoSaveIndicator** - Real-time save status display

### Backend Services
1. **Storage Interface** - Abstraction layer for data persistence
2. **User Management** - Basic user schema and authentication structure
3. **API Routes** - RESTful endpoints for journal operations

### UI System
- **Component Library**: Comprehensive set of accessible UI components
- **Theme System**: Dark mode with custom CSS variables
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Data Flow

### File Management
1. Files are stored using a FileStorage service with localStorage fallback
2. Auto-save triggers after 1-second delay using debounced saves
3. Files are sorted by last modified date
4. Search functionality spans both file names and content

### State Management
1. **File State**: Managed through useFileStorage hook
2. **Auto-save State**: Handled by useAutoSave hook with status tracking
3. **UI State**: Local component state for sidebar visibility and editor modes

### Database Schema
- **Users Table**: Basic user authentication (id, username, password)
- **Extensible**: Schema designed to accommodate journal entries and file metadata

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React 18 with comprehensive Radix UI components
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React for consistent iconography
- **Markdown**: Custom parser (no external markdown library)
- **Fonts**: Google Fonts (Inter, Crimson Text, JetBrains Mono)

### Backend Dependencies
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod for schema validation with drizzle-zod integration
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Replit Integration**: Vite plugins for development environment
- **Type Checking**: TypeScript with strict configuration
- **Hot Reload**: Vite HMR for instant development feedback

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle Kit handles schema migrations

### Environment Configuration
- **Development**: NODE_ENV=development with hot reload
- **Production**: NODE_ENV=production with optimized builds
- **Database**: DATABASE_URL environment variable required

### File Storage Strategy
- **Primary**: Browser File System Access API for modern browsers
- **Fallback**: localStorage for compatibility
- **Future**: Backend database integration for persistent storage

### Performance Considerations
- **Auto-save**: Debounced to prevent excessive API calls
- **Lazy Loading**: Components loaded on demand
- **Optimistic Updates**: UI updates before server confirmation
- **Caching**: TanStack Query for intelligent data caching

The application follows a clean architecture pattern with clear separation between presentation, business logic, and data persistence layers, making it easy to extend and maintain.