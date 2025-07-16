export interface JournalFile {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  path?: string; // For File System API
}

export interface FileStorageService {
  loadFiles(): Promise<JournalFile[]>;
  saveFile(file: JournalFile): Promise<void>;
  deleteFile(fileId: string): Promise<void>;
  createFile(name: string): Promise<JournalFile>;
  supportsFileSystem(): boolean;
}

export type AutoSaveStatus = "saving" | "saved" | "error";

export interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date;
}
