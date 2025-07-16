import { useState, useEffect, useCallback } from 'react';
import { JournalFile, SyncStatus } from '../types/journal';
import { githubSync } from '../services/githubSync';

export const useGitHubSync = () => {
  const [isConnected, setIsConnected] = useState(githubSync.isConnected());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(githubSync.getLastSyncTime());
  const [conflicts, setConflicts] = useState<JournalFile[]>([]);

  useEffect(() => {
    setIsConnected(githubSync.isConnected());
    setLastSynced(githubSync.getLastSyncTime());
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setSyncStatus('idle');
      setLastSynced(null);
      setConflicts([]);
    }
  }, []);

  const syncFile = useCallback(async (file: JournalFile): Promise<JournalFile> => {
    if (!isConnected) return file;

    try {
      setSyncStatus('syncing');
      const syncedFile = await githubSync.syncFile(file);
      setSyncStatus('synced');
      setLastSynced(new Date());
      return syncedFile;
    } catch (error) {
      console.error('Failed to sync file:', error);
      setSyncStatus('error');
      return file;
    }
  }, [isConnected]);

  const syncAllFiles = useCallback(async (files: JournalFile[]): Promise<JournalFile[]> => {
    if (!isConnected) return files;

    try {
      setSyncStatus('syncing');
      const syncedFiles = await githubSync.syncAllFiles(files);
      setSyncStatus('synced');
      setLastSynced(new Date());
      return syncedFiles;
    } catch (error) {
      console.error('Failed to sync all files:', error);
      setSyncStatus('error');
      return files;
    }
  }, [isConnected]);

  const pullChanges = useCallback(async (): Promise<JournalFile[]> => {
    if (!isConnected) return [];

    try {
      setSyncStatus('syncing');
      const remoteFiles = await githubSync.pullChanges();
      setSyncStatus('synced');
      setLastSynced(new Date());
      return remoteFiles;
    } catch (error) {
      console.error('Failed to pull changes:', error);
      setSyncStatus('error');
      return [];
    }
  }, [isConnected]);

  const manualSync = useCallback(async (files: JournalFile[]): Promise<JournalFile[]> => {
    if (!isConnected) return files;

    try {
      setSyncStatus('syncing');
      
      // First try to pull changes
      const remoteFiles = await githubSync.pullChanges();
      
      // Check for conflicts (files that exist both locally and remotely with different content)
      const conflictFiles: JournalFile[] = [];
      const mergedFiles: JournalFile[] = [];
      
      for (const localFile of files) {
        const remoteFile = remoteFiles.find(rf => rf.name === localFile.name);
        
        if (remoteFile) {
          // Check if there's a conflict
          const localModified = localFile.updatedAt.getTime();
          const remoteModified = remoteFile.updatedAt.getTime();
          
          if (localFile.content !== remoteFile.content && 
              (!localFile.lastSyncedAt || localModified > localFile.lastSyncedAt.getTime())) {
            conflictFiles.push(localFile);
            continue;
          }
          
          // Use the more recent file
          mergedFiles.push(localModified > remoteModified ? localFile : remoteFile);
        } else {
          // File only exists locally
          mergedFiles.push(localFile);
        }
      }
      
      // Add files that only exist remotely
      for (const remoteFile of remoteFiles) {
        if (!files.find(lf => lf.name === remoteFile.name)) {
          mergedFiles.push(remoteFile);
        }
      }
      
      if (conflictFiles.length > 0) {
        setConflicts(conflictFiles);
        setSyncStatus('conflict');
        return files; // Return original files when there are conflicts
      }
      
      // Sync all merged files
      const syncedFiles = await githubSync.syncAllFiles(mergedFiles);
      setSyncStatus('synced');
      setLastSynced(new Date());
      return syncedFiles;
      
    } catch (error) {
      console.error('Failed to perform manual sync:', error);
      setSyncStatus('error');
      return files;
    }
  }, [isConnected]);

  const deleteFile = useCallback(async (file: JournalFile): Promise<void> => {
    if (!isConnected) return;

    try {
      setSyncStatus('syncing');
      await githubSync.deleteFile(file);
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (error) {
      console.error('Failed to delete file from GitHub:', error);
      setSyncStatus('error');
      throw error;
    }
  }, [isConnected]);

  const resolveConflicts = useCallback(async (resolvedFiles: JournalFile[]): Promise<JournalFile[]> => {
    if (!isConnected) return resolvedFiles;

    try {
      setSyncStatus('syncing');
      const syncedFiles = await githubSync.syncAllFiles(resolvedFiles);
      setConflicts([]);
      setSyncStatus('synced');
      setLastSynced(new Date());
      return syncedFiles;
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
      setSyncStatus('error');
      return resolvedFiles;
    }
  }, [isConnected]);

  return {
    isConnected,
    syncStatus,
    lastSynced,
    conflicts,
    handleConnectionChange,
    syncFile,
    syncAllFiles,
    pullChanges,
    manualSync,
    deleteFile,
    resolveConflicts
  };
};