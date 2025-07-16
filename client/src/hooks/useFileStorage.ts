import { useState, useEffect } from 'react';
import { JournalFile } from '../types/journal';
import { fileStorage } from '../services/fileStorage';

export const useFileStorage = () => {
  const [files, setFiles] = useState<JournalFile[]>([]);
  const [currentFile, setCurrentFile] = useState<JournalFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const loadedFiles = await fileStorage.loadFiles();
      setFiles(loadedFiles);
      
      // Auto-select the first file if none is selected
      if (loadedFiles.length > 0 && !currentFile) {
        setCurrentFile(loadedFiles[0]);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFile = async (name: string = `journal-${Date.now()}.md`) => {
    try {
      const file = await fileStorage.createFile(name);
      setFiles(prev => [file, ...prev]);
      setCurrentFile(file);
      return file;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  };

  const saveFile = async (file: JournalFile) => {
    try {
      await fileStorage.saveFile(file);
      setFiles(prev => prev.map(f => f.id === file.id ? file : f));
      if (currentFile?.id === file.id) {
        setCurrentFile(file);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
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
    refreshFiles: loadFiles
  };
};
