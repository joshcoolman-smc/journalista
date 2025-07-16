import { JournalFile, GitHubConfig, GitHubSyncService } from '../types/journal';

const GITHUB_CONFIG_KEY = 'zen-journal-github-config';
const GITHUB_SYNC_KEY = 'zen-journal-last-sync';

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
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Invalid GitHub token. Please check your token and try again.');
      }

      const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
        headers: {
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 404) {
        // Repository doesn't exist, try to create it
        const createResponse = await fetch(`https://api.github.com/user/repos`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: config.repo,
            description: 'Personal journal entries managed by Zen Journal',
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
    this.config = null;
    this.lastSyncTime = null;
    localStorage.removeItem(GITHUB_CONFIG_KEY);
    localStorage.removeItem(GITHUB_SYNC_KEY);
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

    try {
      // Get all files from the entries directory
      const response = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/entries`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Directory doesn't exist yet
          return [];
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const files = await response.json();
      const journalFiles: JournalFile[] = [];

      for (const fileInfo of files) {
        if (fileInfo.type === 'file' && fileInfo.name.endsWith('.md')) {
          const fileResponse = await fetch(fileInfo.download_url);
          const content = await fileResponse.text();

          // Parse filename to extract date info for createdAt
          const fileName = fileInfo.name;
          const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
          const createdAt = dateMatch ? new Date(dateMatch[1]) : new Date();

          journalFiles.push({
            id: this.generateIdFromName(fileName),
            name: fileName,
            content,
            createdAt,
            updatedAt: new Date(), // Use current time as updatedAt
            githubSha: fileInfo.sha,
            lastSyncedAt: new Date()
          });
        }
      }

      return journalFiles;
    } catch (error) {
      throw new Error(`Failed to pull changes from GitHub: ${error}`);
    }
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
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
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
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