# Zen Journal

A minimalist, privacy-first markdown journaling application built with React and Express. Write your thoughts in a distraction-free environment with optional GitHub backup.

![Zen Journal Interface](https://img.shields.io/badge/Interface-Clean%20%26%20Minimal-blue)
![Privacy First](https://img.shields.io/badge/Privacy-First-green)
![GitHub Backup](https://img.shields.io/badge/GitHub-Backup-orange)

## Features

### 📝 Writing Experience
- **Markdown Support** - Write with rich formatting using standard markdown syntax
- **Three View Modes** - Split view (default), markdown editor, and live preview
- **Auto-save** - Your work is saved automatically every second
- **Distraction-free** - Clean, minimal interface focused on writing

### 🔒 Privacy & Security
- **Local-first** - All data stored locally on your device
- **No authentication required** - Start writing immediately
- **Privacy-first design** - No tracking, no analytics, no data collection
- **Your data, your control** - You own and control all your content

### 🔄 GitHub Integration (Optional)
- **Automatic backup** - Sync your entries to a private GitHub repository
- **Cross-device access** - Access your journal from any device
- **Version history** - Full git history of all your changes
- **Conflict resolution** - Handle simultaneous edits gracefully
- **Repository auto-creation** - Creates repository if it doesn't exist

### 🛠️ Technical Features
- **Responsive design** - Works on desktop, tablet, and mobile
- **File management** - Create, rename, and delete journal entries
- **Search functionality** - Find entries by name or content
- **Export data** - Download all your entries as JSON
- **Clear all data** - Complete reset when needed

## Getting Started

### For Writers (No Technical Setup Required)

1. **Visit the deployed application** (link coming soon)
2. **Start writing** - No account needed, just open and write
3. **Optional GitHub setup:**
   - Click "Connect GitHub" in the header
   - Enter your GitHub username and desired repository name
   - Create a Personal Access Token with 'repo' scope
   - The app will automatically create the repository if it doesn't exist

### For Developers

#### Prerequisites
- Node.js 18 or higher
- npm or yarn

#### Installation
```bash
git clone https://github.com/yourusername/zen-journal.git
cd zen-journal
npm install
```

#### Development
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

#### Build for Production
```bash
npm run build
```

## Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for state management

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM (for future features)
- **Vite integration** for seamless development

### Storage Strategy
- **Primary**: Browser localStorage for instant access
- **Secondary**: GitHub repository for backup and sync
- **Fallback**: No data loss - works offline

## Security Model

### Local Data
- All journal entries stored in browser localStorage
- No server-side data persistence for user content
- Data never leaves your device unless you choose GitHub sync

### GitHub Integration
- Personal Access Tokens stored locally (not on server)
- Repository access controlled by user's GitHub permissions
- All sync operations happen client-side
- Uses HTTPS for all GitHub API communications

### Public Deployment Safety
- **No shared data** - Each user's data is completely isolated
- **No authentication backend** - No user accounts or session management
- **Stateless server** - Server only serves static files
- **No API keys exposed** - All GitHub tokens are user-provided

## Repository Structure

```
zen-journal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript definitions
├── server/                # Express backend
├── shared/                # Shared types and schemas
└── attached_assets/       # Design and documentation
```

## GitHub Integration Setup

### Creating a Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set description: "Zen Journal"
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
├── .zenjournal/
│   └── metadata.json
└── README.md
```

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
- You can export or delete all data at any time
- No vendor lock-in - all data is in standard markdown format

## Contributing

This project is not currently accepting contributions. It's designed as a personal journaling tool with a focus on simplicity and privacy.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues or questions about the application, please open an issue on GitHub.

---

**Privacy First. Markdown Powered. GitHub Backed.**

Happy journaling! 📝