import { JournalFile, GitHubConfig, GitHubSyncService, GitHubRepository, RepositoryAnalysis } from '../types/journal';

// Enhanced logging for debugging (production-ready logging)
const debugLog = (message: string, data?: any) => {
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    console.log(`[GitHub Sync ${timestamp}] ${message}${logData}`);
  }
};

const GITHUB_CONFIG_KEY = 'journalista-github-config';
const GITHUB_SYNC_KEY = 'journalista-last-sync';
const GITHUB_TOKEN_KEY = 'journalista-github-token';

interface GitHubFileResponse {
  content: string;
  sha: string;
  path: string;
}

interface GitHubCommitResponse {
  content: {
    sha: string;
    path: string;
  };
}

export class GitHubSync implements GitHubSyncService {
  private config: GitHubConfig | null = null;
  private lastSyncTime: Date | null = null;
  private repositoryAnalysisCache: Map<string, { analysis: RepositoryAnalysis; timestamp: number }> = new Map();

  constructor() {
    this.loadConfig();
  }

  isConnected(): boolean {
    return this.config !== null;
  }

  async connect(config: GitHubConfig): Promise<void> {
    // Validate the token and repo access
    try {
      // First validate the token has repo scope
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Invalid GitHub token. Please check your token and try again.');
      }

      const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (response.status === 404) {
        // Repository doesn't exist, try to create it
        const createResponse = await fetch(`https://api.github.com/user/repos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: config.repo,
            description: 'Personal journal entries managed by journalista',
            private: true,
            auto_init: true
          })
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(`Failed to create repository: ${errorData.message || createResponse.statusText}`);
        }
      } else if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
      }

      this.config = config;
      this.saveConfig();
    } catch (error) {
      throw new Error(`Failed to connect to GitHub: ${error}`);
    }
  }

  disconnect(): void {
    debugLog('Disconnecting from GitHub', { keepToken: true });
    this.config = null;
    this.lastSyncTime = null;
    localStorage.removeItem(GITHUB_CONFIG_KEY);
    localStorage.removeItem(GITHUB_SYNC_KEY);
    // Note: We keep the token for easy reconnection
  }

  fullDisconnect(): void {
    debugLog('Full disconnect from GitHub', { clearToken: true });
    this.config = null;
    this.lastSyncTime = null;
    localStorage.removeItem(GITHUB_CONFIG_KEY);
    localStorage.removeItem(GITHUB_SYNC_KEY);
    localStorage.removeItem(GITHUB_TOKEN_KEY);
  }

  async syncFile(file: JournalFile): Promise<JournalFile> {
    if (!this.config) {
      throw new Error('GitHub not connected');
    }

    const path = `entries/${file.name}`;
    const message = `Update ${file.name}`;
    
    try {
      // Create or update the file
      const response = await this.createOrUpdateFile(path, file.content, message, file.githubSha);
      
      return {
        ...file,
        githubSha: response.content.sha,
        lastSyncedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to sync file ${file.name}: ${error}`);
    }
  }

  async syncAllFiles(files: JournalFile[]): Promise<JournalFile[]> {
    if (!this.config) {
      throw new Error('GitHub not connected');
    }

    const syncedFiles: JournalFile[] = [];
    
    for (const file of files) {
      try {
        const syncedFile = await this.syncFile(file);
        syncedFiles.push(syncedFile);
      } catch (error) {
        console.error(`Failed to sync file ${file.name}:`, error);
        syncedFiles.push(file); // Keep original if sync fails
      }
    }

    this.updateLastSyncTime();
    return syncedFiles;
  }

  async pullChanges(): Promise<JournalFile[]> {
    if (!this.config) {
      throw new Error('GitHub not connected');
    }

    debugLog('Starting pullChanges', { owner: this.config.owner, repo: this.config.repo });

    try {
      // Get all files from the entries directory
      const entriesUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/entries`;
      debugLog('Fetching entries directory', { url: entriesUrl });
      
      const response = await fetch(entriesUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      debugLog('Entries directory response', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Directory doesn't exist yet
          console.log('Entries directory does not exist - returning empty array');
          return [];
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const files = await response.json();
      debugLog('Found files in repository', { fileCount: files.length });
      
      const journalFiles: JournalFile[] = [];

      for (const fileInfo of files) {
        if (fileInfo.type === 'file' && fileInfo.name.endsWith('.md')) {
          debugLog('Processing markdown file', { 
            name: fileInfo.name, 
            sha: fileInfo.sha,
            downloadUrl: fileInfo.download_url 
          });
          
          // Use GitHub Contents API instead of raw download URL for files with spaces
          const contentsUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/entries/${encodeURIComponent(fileInfo.name)}`;
          debugLog('Fetching file content via Contents API', { 
            fileName: fileInfo.name,
            contentsUrl: contentsUrl 
          });
          
          const fileResponse = await fetch(contentsUrl, {
            headers: {
              'Authorization': `Bearer ${this.config.token}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28'
            }
          });
          
          debugLog('File download response', {
            fileName: fileInfo.name,
            status: fileResponse.status,
            statusText: fileResponse.statusText,
            ok: fileResponse.ok
          });
          
          if (!fileResponse.ok) {
            debugLog('File download failed', {
              fileName: fileInfo.name,
              url: contentsUrl,
              status: fileResponse.status,
              statusText: fileResponse.statusText
            });
            throw new Error(`Failed to download file ${fileInfo.name}: ${fileResponse.status} ${fileResponse.statusText}`);
          }
          
          // Parse the GitHub Contents API response (content is base64 encoded)
          const fileData = await fileResponse.json();
          debugLog('Received file data from Contents API', {
            fileName: fileInfo.name,
            encoding: fileData.encoding,
            size: fileData.size
          });
          
          if (fileData.encoding !== 'base64') {
            throw new Error(`Unexpected encoding for file ${fileInfo.name}: ${fileData.encoding}`);
          }
          
          // Decode base64 content
          const content = atob(fileData.content);
          debugLog('File content loaded', { 
            fileName: fileInfo.name, 
            contentLength: content.length,
            contentPreview: content.substring(0, 100)
          });

          // Parse filename to extract date info for createdAt
          const fileName = fileInfo.name;
          const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
          const createdAt = dateMatch ? new Date(dateMatch[1]) : new Date();

          const fileObj = {
            id: this.generateIdFromName(fileName),
            name: fileName,
            content,
            createdAt,
            updatedAt: new Date(), // Use current time as updatedAt
            githubSha: fileInfo.sha,
            lastSyncedAt: new Date()
          };
          
          debugLog('Created journal file object', {
            id: fileObj.id,
            name: fileObj.name,
            contentLength: fileObj.content.length,
            contentPreview: fileObj.content.substring(0, 100),
            hasContent: fileObj.content.length > 0
          });
          
          journalFiles.push(fileObj);
        }
      }

      debugLog('Pull changes completed', { 
        totalFiles: journalFiles.length,
        fileNames: journalFiles.map(f => f.name)
      });
      return journalFiles;
    } catch (error) {
      debugLog('Pull changes failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw new Error(`Failed to pull changes from GitHub: ${error}`);
    }
  }

  async deleteFile(file: JournalFile): Promise<void> {
    if (!this.config) {
      throw new Error('GitHub not connected');
    }

    if (!file.githubSha) {
      throw new Error('File does not have GitHub SHA - cannot delete');
    }

    const path = `entries/${file.name}`;
    
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Delete ${file.name}`,
            sha: file.githubSha
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GitHub delete error:', errorData);
        throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
      }

      await response.json();

      this.updateLastSyncTime();
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error(`Failed to delete file from GitHub: ${error}`);
    }
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async listRepositories(token: string): Promise<GitHubRepository[]> {
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const repositories: GitHubRepository[] = await response.json();
      return repositories;
    } catch (error) {
      throw new Error(`Failed to list repositories: ${error}`);
    }
  }

  async createRepository(token: string, name: string): Promise<GitHubRepository> {
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description: 'Personal journal entries managed by Zen Journal',
          private: true,
          auto_init: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create repository: ${errorData.message || response.statusText}`);
      }

      const repository: GitHubRepository = await response.json();
      return repository;
    } catch (error) {
      throw new Error(`Failed to create repository: ${error}`);
    }
  }

  getCurrentRepository(): GitHubConfig | null {
    return this.config;
  }

  async switchRepository(owner: string, repo: string): Promise<void> {
    if (!this.config) {
      throw new Error('GitHub not connected');
    }

    // Update the config with new repository
    const newConfig: GitHubConfig = {
      ...this.config,
      owner,
      repo
    };

    // Validate access to the new repository
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${newConfig.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) {
      throw new Error(`Cannot access repository ${owner}/${repo}. Please check permissions.`);
    }

    this.config = newConfig;
    this.saveConfig();
  }

  storeToken(token: string): void {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
  }

  getStoredToken(): string | null {
    return localStorage.getItem(GITHUB_TOKEN_KEY);
  }

  clearStoredToken(): void {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
  }

  async analyzeRepository(token: string, owner: string, repo: string): Promise<RepositoryAnalysis> {
    debugLog('Starting repository analysis', { owner, repo });
    
    // Check cache first (cache for 5 minutes)
    const cacheKey = `${owner}/${repo}`;
    const cached = this.repositoryAnalysisCache.get(cacheKey);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      debugLog('Returning cached repository analysis', { owner, repo });
      return cached.analysis;
    }
    
    try {
      // Get repository metadata
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (!repoResponse.ok) {
        throw new Error(`Failed to fetch repository: ${repoResponse.status}`);
      }

      const repoData = await repoResponse.json();
      
      // Get repository contents (root level)
      const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      let rootFiles: any[] = [];
      if (contentsResponse.ok) {
        rootFiles = await contentsResponse.json();
      }

      // Check for entries folder
      const hasEntriesFolder = rootFiles.some(file => 
        file.type === 'dir' && file.name === 'entries'
      );

      // Development file patterns
      const developmentFiles = [
        'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
        'Cargo.toml', 'Cargo.lock', 'go.mod', 'go.sum',
        'requirements.txt', 'poetry.lock', 'Pipfile', 'setup.py',
        'pom.xml', 'build.gradle', 'composer.json',
        'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
        '.gitignore', '.env', '.env.example',
        'tsconfig.json', 'webpack.config.js', 'vite.config.ts',
        'rollup.config.js', 'babel.config.js'
      ];

      const developmentDirs = [
        'src', 'lib', 'components', 'pages', 'utils', 'hooks',
        'tests', 'test', '__tests__', 'spec', '__specs__',
        'dist', 'build', 'public', 'static', 'assets',
        'node_modules', '.git', '.github', '.vscode',
        'target', 'vendor', '__pycache__'
      ];

      const foundDevelopmentFiles = rootFiles
        .filter(file => file.type === 'file')
        .map(file => file.name)
        .filter(name => developmentFiles.includes(name));

      const foundDevelopmentDirs = rootFiles
        .filter(file => file.type === 'dir')
        .map(file => file.name)
        .filter(name => developmentDirs.includes(name));

      const hasDevelopmentFiles = foundDevelopmentFiles.length > 0 || foundDevelopmentDirs.length > 0;
      const fileCount = rootFiles.length;
      
      // Check for journal-related keywords in description
      const description = repoData.description || '';
      const journalKeywords = ['journal', 'diary', 'notes', 'personal', 'log', 'daily'];
      const hasJournalKeywords = journalKeywords.some(keyword => 
        description.toLowerCase().includes(keyword)
      );

      // Get contributors count (simplified - just check if it's a single-user repo)
      const contributorCount = 1; // We'll assume single user for simplicity

      // Determine repository type and confidence
      let type: 'journal-appropriate' | 'development' | 'unknown' = 'unknown';
      let confidence = 0;
      let recommendation = '';

      if (hasEntriesFolder || hasJournalKeywords) {
        type = 'journal-appropriate';
        confidence = hasEntriesFolder ? 0.9 : 0.7;
        recommendation = 'This repository appears to be set up for journaling.';
      } else if (hasDevelopmentFiles && fileCount > 5) {
        type = 'development';
        confidence = 0.8;
        recommendation = `This appears to be a development project. Adding journal entries will create an 'entries/' folder with your personal notes.`;
      } else if (fileCount <= 3) {
        type = 'journal-appropriate';
        confidence = 0.6;
        recommendation = 'This repository has minimal content and appears suitable for journaling.';
      } else {
        type = 'unknown';
        confidence = 0.3;
        recommendation = 'Unable to determine the repository type. Proceed with caution.';
      }

      const analysis: RepositoryAnalysis = {
        type,
        confidence,
        indicators: {
          hasEntriesFolder,
          fileCount,
          hasDevelopmentFiles,
          hasJournalKeywords,
          contributorCount,
          developmentFileTypes: [...foundDevelopmentFiles, ...foundDevelopmentDirs]
        },
        recommendation
      };

      debugLog('Repository analysis completed', analysis);
      
      // Cache the result
      this.repositoryAnalysisCache.set(cacheKey, {
        analysis,
        timestamp: Date.now()
      });
      
      return analysis;

    } catch (error) {
      debugLog('Repository analysis failed', { error: error instanceof Error ? error.message : String(error) });
      // Return a conservative analysis on error
      return {
        type: 'unknown',
        confidence: 0,
        indicators: {
          hasEntriesFolder: false,
          fileCount: 0,
          hasDevelopmentFiles: false,
          hasJournalKeywords: false,
          contributorCount: 1,
          developmentFileTypes: []
        },
        recommendation: 'Unable to analyze repository. Proceed with caution.'
      };
    }
  }

  private async createOrUpdateFile(path: string, content: string, message: string, sha?: string): Promise<GitHubCommitResponse> {
    if (!this.config) {
      throw new Error('GitHub not connected');
    }

    const body: any = {
      message,
      content: btoa(unescape(encodeURIComponent(content))) // Base64 encode
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private generateIdFromName(fileName: string): string {
    // Create a consistent ID from filename
    return fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(GITHUB_CONFIG_KEY);
      if (stored) {
        this.config = JSON.parse(stored);
      }

      const syncTime = localStorage.getItem(GITHUB_SYNC_KEY);
      if (syncTime) {
        this.lastSyncTime = new Date(syncTime);
      }
    } catch (error) {
      console.error('Failed to load GitHub config:', error);
    }
  }

  private saveConfig(): void {
    if (this.config) {
      localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(this.config));
    }
  }

  private updateLastSyncTime(): void {
    this.lastSyncTime = new Date();
    localStorage.setItem(GITHUB_SYNC_KEY, this.lastSyncTime.toISOString());
  }
}

export const githubSync = new GitHubSync();