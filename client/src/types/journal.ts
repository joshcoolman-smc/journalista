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
  supportsFileSystem(): boolean;
}

export interface GitHubConfig {
  token: string;
  repo: string;
  owner: string;
}

export interface GitHubSyncService {
  isConnected(): boolean;
  connect(config: GitHubConfig): Promise<void>;
  disconnect(): void;
  syncFile(file: JournalFile): Promise<JournalFile>;
  syncAllFiles(files: JournalFile[]): Promise<JournalFile[]>;
  pullChanges(): Promise<JournalFile[]>;
  getLastSyncTime(): Date | null;
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
