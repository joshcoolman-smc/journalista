# journalista

A minimalist, privacy-first markdown journaling application built with React and Express. Write your thoughts in a distraction-free environment with optional GitHub backup.

![journalista Interface](https://img.shields.io/badge/Interface-Clean%20%26%20Minimal-blue)
![Privacy First](https://img.shields.io/badge/Privacy-First-green)
![GitHub Backup](https://img.shields.io/badge/GitHub-Backup-orange)

## Features

### 📝 Writing Experience
- **Markdown Support** - Write with rich formatting using standard markdown syntax
- **Three View Modes** - Edit mode (default), split view, and preview mode
- **Auto-save** - Your work is saved automatically every second
- **Distraction-free** - Clean, minimal interface focused on writing
- **File Management** - Create, rename, and delete journal entries easily

### 🔒 Privacy & Security
- **Local-first** - All data stored locally in your browser
- **No authentication required** - Start writing immediately
- **Privacy-first design** - No tracking, no analytics, no data collection
- **Your data, your control** - You own and control all your content

### 🔄 GitHub Integration (Optional)
- **Automatic backup** - Sync your entries to a private GitHub repository
- **Cross-device access** - Access your journal from any device
- **Version history** - Full git history of all your changes
- **Conflict resolution** - Handle simultaneous edits gracefully
- **Repository auto-creation** - Creates repository if it doesn't exist
- **Repository browsing** - Connect to existing repositories or create new ones

### 🛠️ Technical Features
- **Responsive design** - Works on desktop, tablet, and mobile
- **Local storage** - All data persists in your browser
- **Offline-first** - Works without internet connection
- **Modern UI** - Built with Radix UI components and Tailwind CSS

## Getting Started

### For Writers (No Technical Setup Required)

1. **Clone and run locally** (see developer setup below) or wait for hosted version
2. **Start writing** - No account needed, just open and start typing
3. **Optional GitHub setup:**
   - Click the settings icon in the header
   - Connect to GitHub with your Personal Access Token
   - Choose an existing repository or create a new one
   - Your entries will sync automatically to the `entries/` folder

### For Developers

#### Prerequisites
- Node.js 18 or higher
- npm or yarn

#### Installation
```bash
git clone https://github.com/joshcoolman/journalista.git
cd journalista
npm install
```

#### Development
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

#### Build for Production
```bash
npm run build
npm start
```

#### Type Checking
```bash
npm run check
```

## Deployment

### Easy Deployment - Static Site with Express

journalista is designed for simple deployment. The server is just a lightweight Express app that serves static files in production - **no database, no authentication, no complex backend**.

### Port Configuration

**Default Port**: 3000  
**Environment Variable**: `PORT`

To change the port:
```bash
# Option 1: Set environment variable (temporary)
PORT=8080 npm start
```

**Option 2: Permanent change** - Edit `server/index.ts`:
```typescript
// Find this line (around line 62) and change "3000" to your desired port:
const port = parseInt(process.env.PORT || "3000", 10);
//                                      ^^^^^^
//                          Change this number to your preferred port
```

### Deployment Options

#### Option 1: Static Site Hosts (Easiest)
Since the app is client-side only, you can deploy just the built files:
```bash
npm run build
# Deploy the dist/public folder to:
# - Vercel, Netlify, GitHub Pages, etc.
```

#### Option 2: Node.js Hosts (Full-stack ready)
Deploy the full Express app for future API expansion:
```bash
# Platforms: Railway, Render, DigitalOcean, AWS, etc.
npm run build
npm start
```

#### Option 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for state management
- **Wouter** for lightweight routing

### Backend
- **Express.js** with TypeScript
- **Stateless server** - serves static files only
- **Vite integration** for seamless development
- **No database** - completely client-side data storage

### Storage Strategy
- **Primary**: Browser localStorage for instant access and privacy
- **Secondary**: GitHub repository for backup and cross-device sync
- **No server storage** - your data stays on your device and your GitHub account

## Security Model

### Local Data
- All journal entries stored in browser localStorage only
- No server-side data persistence for user content
- Data never leaves your device unless you choose GitHub sync

### GitHub Integration
- Personal Access Tokens stored locally (not on server)
- Repository access controlled by your GitHub permissions
- All sync operations happen client-side via GitHub API
- Uses HTTPS for all GitHub API communications

### Public Deployment Safety
- **No shared data** - Each user's data is completely isolated
- **No authentication backend** - No user accounts or session management
- **Stateless server** - Server only serves static files and handles no user data
- **No API keys exposed** - All GitHub tokens are user-provided and stored locally

## Repository Structure

```
journalista/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript definitions
├── server/                # Express backend
└── ai-progress/           # Development planning documents
```

## GitHub Integration Setup

### Creating a Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set description: "journalista"
4. Select scope: `repo` (Full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again)

### Repository Structure

When you connect GitHub, your journal entries are organized as:

```
your-journal-repo/
├── entries/
│   ├── 2025-01-16-morning-thoughts.md
│   ├── 2025-01-15-project-ideas.md
│   └── daily-journal.md
└── README.md
```

## View Modes

### Edit Mode (Default)
- Full-width markdown editor
- Word count display
- Focused writing experience

### Split Mode
- Side-by-side markdown editor and live preview
- Real-time rendering as you type
- Ideal for formatting-heavy content

### Preview Mode
- Full-width rendered markdown view
- Clean reading experience
- Perfect for reviewing your entries

## Privacy & Data Policy

### What We Store
- **Locally**: Your journal entries in browser localStorage
- **GitHub**: Only what you choose to sync to your personal repository
- **Server**: No user data whatsoever

### What We Don't Store
- No user accounts or authentication data
- No analytics or tracking data
- No copies of your journal entries
- No GitHub tokens or credentials

### Data Ownership
- You own all your content
- You control what gets synced to GitHub
- You can clear all data at any time
- No vendor lock-in - all data is in standard markdown format

## Development Philosophy

This project demonstrates:
- **AI-assisted development** - Built collaboratively with Claude Code
- **Privacy-first design** - Your data belongs to you
- **Local-first architecture** - Works offline, syncs when you want
- **Clean, maintainable code** - TypeScript throughout with good patterns

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Privacy First. Markdown Powered. GitHub Backed.**

Happy journaling! 📝