import { useState, useEffect } from 'react';
import { JournalFile } from '../types/journal';
import { fileStorage } from '../services/fileStorage';
import { useGitHubSync } from './useGitHubSync';

export const useFileStorage = () => {
  const [files, setFiles] = useState<JournalFile[]>([]);
  const [currentFile, setCurrentFile] = useState<JournalFile | null>(null);
  const [loading, setLoading] = useState(true);
  const githubSync = useGitHubSync();

  useEffect(() => {
    loadFiles();
  }, [githubSync.isConnected]); // React to connection changes

  const loadFiles = async () => {
    try {
      setLoading(true);
      
      // If GitHub is connected, GitHub is the source of truth
      if (githubSync.isConnected) {
        // GitHub is the ONLY source of truth when connected
        console.log('[Storage] Loading from GitHub (connected mode)');
        const githubFiles = await githubSync.pullChanges();
        setFiles(githubFiles);
        
        // Auto-select the first file if we have files
        if (githubFiles.length > 0) {
          setCurrentFile(githubFiles[0]);
        } else {
          setCurrentFile(null);
        }
      } else {
        // Local storage ONLY when not connected to GitHub
        console.log('[Storage] Loading from localStorage (local mode)');
        const localFiles = await fileStorage.loadFiles();
        setFiles(localFiles);
        
        if (localFiles.length > 0) {
          setCurrentFile(localFiles[0]);
        } else {
          setCurrentFile(null);
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]); // Ensure we set an empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createFile = async (name: string = `journal-${Date.now()}.md`) => {
    try {
      const file = await fileStorage.createFile(name);
      let finalFile = file;
      
      // If GitHub is connected, sync the new file immediately
      if (githubSync.isConnected) {
        try {
          finalFile = await githubSync.syncFile(file);
          await fileStorage.saveFile(finalFile); // Update localStorage with GitHub metadata
        } catch (error) {
          console.error('Failed to sync new file to GitHub:', error);
          // Continue with local file even if GitHub sync fails
        }
      }
      
      setFiles(prev => [finalFile, ...prev]);
      setCurrentFile(finalFile);
      return finalFile;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  };

  const createTemporaryFile = (name: string = `journal-${Date.now()}.md`) => {
    // Create a temporary file object that hasn't been saved yet
    const tempFile: JournalFile = {
      id: `temp-${Date.now()}`,
      name,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      // No githubSha or lastSyncedAt since it's not saved yet
    };
    
    setFiles(prev => [tempFile, ...prev]);
    setCurrentFile(tempFile);
    return tempFile;
  };

  const confirmFileCreation = async (tempFile: JournalFile, finalName: string) => {
    try {
      // Remove the temporary file from the list
      setFiles(prev => prev.filter(f => f.id !== tempFile.id));
      
      // Create the actual file with the confirmed name
      const finalFile = await createFile(finalName.endsWith('.md') ? finalName : `${finalName}.md`);
      
      // If there was content in the temp file, update the final file
      if (tempFile.content) {
        await saveFile({ ...finalFile, content: tempFile.content });
      }
      
      return finalFile;
    } catch (error) {
      console.error('Failed to confirm file creation:', error);
      throw error;
    }
  };

  const cancelFileCreation = (tempFile: JournalFile) => {
    setFiles(prev => prev.filter(f => f.id !== tempFile.id));
    const remainingFiles = files.filter(f => f.id !== tempFile.id);
    setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
  };

  const saveFile = async (file: JournalFile) => {
    try {
      let finalFile = file;
      
      if (githubSync.isConnected) {
        // GitHub ONLY - no local storage when connected
        console.log('[Storage] Saving to GitHub (connected mode)');
        finalFile = await githubSync.syncFile(file);
      } else {
        // Local storage ONLY when not connected
        console.log('[Storage] Saving to localStorage (local mode)');
        await fileStorage.saveFile(file);
      }
      
      // Update files state
      setFiles(prev => prev.map(f => f.id === finalFile.id ? finalFile : f));
      if (currentFile?.id === finalFile.id) {
        setCurrentFile(finalFile);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const fileToDelete = files.find(f => f.id === fileId);
      
      if (githubSync.isConnected) {
        // GitHub ONLY - delete from GitHub when connected
        if (fileToDelete?.githubSha) {
          console.log('[Storage] Deleting from GitHub (connected mode)');
          await githubSync.deleteFile(fileToDelete);
        }
      } else {
        // Local storage ONLY when not connected
        console.log('[Storage] Deleting from localStorage (local mode)');
        await fileStorage.deleteFile(fileId);
      }
      
      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      if (currentFile?.id === fileId) {
        const remainingFiles = files.filter(f => f.id !== fileId);
        setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  };

  const selectFile = (file: JournalFile) => {
    console.log('[File Selection]', {
      id: file.id,
      name: file.name,
      contentLength: file.content?.length || 0,
      contentPreview: file.content?.substring(0, 100) || 'No content',
      hasContent: Boolean(file.content && file.content.length > 0)
    });
    setCurrentFile(file);
  };

  const clearAllData = async () => {
    console.log('[Storage] Clearing all data - reset to initial state');
    
    // Clear in-memory state
    setFiles([]);
    setCurrentFile(null);
    
    // Also clear localStorage to prevent any persistence
    try {
      await fileStorage.clearAll();
      console.log('[Storage] Cleared localStorage');
    } catch (error) {
      console.error('[Storage] Failed to clear localStorage:', error);
    }
  };

  return {
    files,
    currentFile,
    loading,
    createFile,
    createTemporaryFile,
    confirmFileCreation,
    cancelFileCreation,
    saveFile,
    deleteFile,
    selectFile,
    refreshFiles: loadFiles,
    clearAllData,
    githubSync
  };
};
