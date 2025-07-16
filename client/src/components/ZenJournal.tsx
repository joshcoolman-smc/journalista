import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { EditorCanvas } from './EditorCanvas';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { useFileStorage } from '../hooks/useFileStorage';
import { useAutoSave } from '../hooks/useAutoSave';
import { JournalFile } from '../types/journal';

export const ZenJournal = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const {
    files,
    currentFile,
    loading,
    createFile,
    saveFile,
    deleteFile,
    selectFile
  } = useFileStorage();

  const { status, lastSaved, triggerAutoSave } = useAutoSave(currentFile, saveFile);

  const handleContentChange = useCallback((content: string) => {
    if (currentFile) {
      const updatedFile = { ...currentFile, content };
      triggerAutoSave(updatedFile);
    }
  }, [currentFile, triggerAutoSave]);

  const handleFileNameChange = useCallback((name: string) => {
    if (currentFile) {
      const updatedFile = { ...currentFile, name };
      saveFile(updatedFile);
    }
  }, [currentFile, saveFile]);

  const handleCreateFile = useCallback(async () => {
    try {
      await createFile();
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  }, [createFile]);

  const handleDeleteFile = useCallback(async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(fileId);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  }, [deleteFile]);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
               style={{ borderColor: 'var(--zen-accent)' }}></div>
          <p style={{ color: 'var(--zen-text-muted)' }}>Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ 
          borderColor: 'var(--zen-border)',
          backgroundColor: 'var(--zen-bg-secondary)'
        }}
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="transition-zen focus-ring p-1 rounded"
            style={{ color: 'var(--zen-text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-medium" style={{ color: 'var(--zen-text-primary)' }}>
            Zen Journal
          </h1>
        </div>
        
        <AutoSaveIndicator status={status} lastSaved={lastSaved} />
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          files={files}
          currentFile={currentFile}
          onFileSelect={selectFile}
          onFileCreate={handleCreateFile}
          onFileDelete={handleDeleteFile}
          visible={sidebarVisible}
          onToggle={toggleSidebar}
        />
        
        <EditorCanvas
          file={currentFile}
          onContentChange={handleContentChange}
          onSidebarToggle={toggleSidebar}
          onFileNameChange={handleFileNameChange}
          sidebarVisible={sidebarVisible}
        />
      </div>
    </div>
  );
};
