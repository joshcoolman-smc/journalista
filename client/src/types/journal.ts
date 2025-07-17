export interface JournalFile {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  path?: string; // For File System API
  githubSha?: string; // GitHub file SHA for updates
  lastSyncedAt?: Date; // When this file was last synced to GitHub
}

export interface FileStorageService {
  loadFiles(): Promise<JournalFile[]>;
  saveFile(file: JournalFile): Promise<void>;
  deleteFile(fileId: string): Promise<void>;
  createFile(name: string): Promise<JournalFile>;
  clearAll(): Promise<void>;
  supportsFileSystem(): boolean;
}

export interface GitHubConfig {
  token: string;
  repo: string;
  owner: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    type: string;
  };
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubSyncService {
  isConnected(): boolean;
  connect(config: GitHubConfig): Promise<void>;
  disconnect(): void;
  syncFile(file: JournalFile): Promise<JournalFile>;
  syncAllFiles(files: JournalFile[]): Promise<JournalFile[]>;
  pullChanges(): Promise<JournalFile[]>;
  deleteFile(file: JournalFile): Promise<void>;
  getLastSyncTime(): Date | null;
  // New repository management methods
  validateToken(token: string): Promise<boolean>;
  listRepositories(token: string): Promise<GitHubRepository[]>;
  createRepository(token: string, name: string): Promise<GitHubRepository>;
  getCurrentRepository(): GitHubConfig | null;
  switchRepository(owner: string, repo: string): Promise<void>;
  // Repository analysis
  analyzeRepository(token: string, owner: string, repo: string): Promise<RepositoryAnalysis>;
  // Token-only storage methods
  storeToken(token: string): void;
  getStoredToken(): string | null;
  clearStoredToken(): void;
}

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "conflict";

export interface SyncIndicatorProps {
  status: SyncStatus;
  lastSynced?: Date;
  onManualSync?: () => void;
  onResolveConflicts?: () => void;
}

export type AutoSaveStatus = "saving" | "saved" | "error";

export interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date;
}

export interface RepositoryAnalysis {
  type: 'journal-appropriate' | 'development' | 'unknown';
  confidence: number; // 0-1
  indicators: {
    hasEntriesFolder: boolean;
    fileCount: number;
    hasDevelopmentFiles: boolean;
    hasJournalKeywords: boolean;
    contributorCount: number;
    developmentFileTypes: string[];
  };
  recommendation: string;
}
