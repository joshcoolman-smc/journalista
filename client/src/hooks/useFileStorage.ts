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
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      
      // If GitHub is connected, GitHub is the source of truth
      if (githubSync.isConnected) {
        try {
          // Pull the latest files from GitHub (source of truth)
          const githubFiles = await githubSync.pullChanges();
          
          // Update localStorage cache with GitHub data
          await fileStorage.clearAll();
          for (const file of githubFiles) {
            await fileStorage.saveFile(file);
          }
          
          setFiles(githubFiles);
          
          // Auto-select the first file if none is selected and we have files
          if (githubFiles.length > 0 && !currentFile) {
            setCurrentFile(githubFiles[0]);
          }
        } catch (error) {
          console.error('Failed to load from GitHub, falling back to localStorage:', error);
          // Fallback to localStorage if GitHub fails
          const localFiles = await fileStorage.loadFiles();
          setFiles(localFiles);
          
          if (localFiles.length > 0 && !currentFile) {
            setCurrentFile(localFiles[0]);
          }
        }
      } else {
        // No GitHub connection, use localStorage as primary storage
        const localFiles = await fileStorage.loadFiles();
        setFiles(localFiles);
        
        // Auto-select the first file if none is selected and we have files
        if (localFiles.length > 0 && !currentFile) {
          setCurrentFile(localFiles[0]);
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

  const saveFile = async (file: JournalFile) => {
    try {
      let finalFile = file;
      
      // If GitHub is connected, save to GitHub first (source of truth)
      if (githubSync.isConnected) {
        try {
          finalFile = await githubSync.syncFile(file);
          // Update localStorage cache with GitHub metadata
          await fileStorage.saveFile(finalFile);
        } catch (error) {
          console.error('Failed to sync file to GitHub:', error);
          // Still save to localStorage even if GitHub fails
          await fileStorage.saveFile(file);
          finalFile = file;
        }
      } else {
        // No GitHub connection, save to localStorage only
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
      
      // If GitHub is connected and file has GitHub SHA, delete from GitHub first
      if (githubSync.isConnected && fileToDelete?.githubSha) {
        try {
          await githubSync.deleteFile(fileToDelete);
          console.log('File successfully deleted from GitHub repository');
        } catch (error) {
          console.error('Failed to delete file from GitHub:', error);
          // Continue with local deletion even if GitHub fails
        }
      }
      
      // Always delete from localStorage
      await fileStorage.deleteFile(fileId);
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
    setCurrentFile(file);
  };

  return {
    files,
    currentFile,
    loading,
    createFile,
    saveFile,
    deleteFile,
    selectFile,
    refreshFiles: loadFiles,
    githubSync
  };
};
