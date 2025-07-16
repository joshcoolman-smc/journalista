import { JournalFile, FileStorageService } from '../types/journal';

const STORAGE_KEY = 'zen-journal-files';

export class FileStorage implements FileStorageService {
  private files: Map<string, JournalFile> = new Map();
  private fileSystemSupported = false;

  constructor() {
    this.fileSystemSupported = 'showOpenFilePicker' in window;
    this.loadFromStorage();
  }

  supportsFileSystem(): boolean {
    return this.fileSystemSupported;
  }

  async loadFiles(): Promise<JournalFile[]> {
    return Array.from(this.files.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async saveFile(file: JournalFile): Promise<void> {
    const updatedFile = {
      ...file,
      updatedAt: new Date()
    };
    
    this.files.set(file.id, updatedFile);
    await this.saveToStorage();
  }

  async deleteFile(fileId: string): Promise<void> {
    this.files.delete(fileId);
    await this.saveToStorage();
  }

  async createFile(name: string): Promise<JournalFile> {
    const file: JournalFile = {
      id: this.generateId(),
      name: name.endsWith('.md') ? name : `${name}.md`,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.files.set(file.id, file);
    await this.saveToStorage();
    return file;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async saveToStorage(): Promise<void> {
    try {
      const filesArray = Array.from(this.files.values());
      const serializedFiles = filesArray.map(file => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString()
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedFiles));
    } catch (error) {
      console.error('Failed to save files to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const filesArray = JSON.parse(stored);
        filesArray.forEach((file: any) => {
          this.files.set(file.id, {
            ...file,
            createdAt: new Date(file.createdAt),
            updatedAt: new Date(file.updatedAt)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load files from localStorage:', error);
    }
  }
}

export const fileStorage = new FileStorage();
