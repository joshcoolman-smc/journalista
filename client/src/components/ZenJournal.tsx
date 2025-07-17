import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { EditorCanvas } from './EditorCanvas';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { SyncIndicator } from './SyncIndicator';
import { ConflictResolution } from './ConflictResolution';
import { SettingsPanel } from './SettingsPanel';
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
    createTemporaryFile,
    confirmFileCreation,
    cancelFileCreation,
    saveFile,
    deleteFile,
    selectFile,
    clearAllData,
    refreshFiles,
    githubSync
  } = useFileStorage();

  const { status, lastSaved, triggerAutoSave } = useAutoSave(currentFile, saveFile);
  const [showConflictResolution, setShowConflictResolution] = useState(false);

  const handleContentChange = useCallback((content: string) => {
    if (currentFile) {
      const updatedFile = { ...currentFile, content };
      triggerAutoSave(updatedFile);
    }
  }, [currentFile, triggerAutoSave]);

  const handleFileNameChange = useCallback(async (fileId: string, name: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      // Check if this is a temporary file
      if (file.id.startsWith('temp-')) {
        // Confirm the temporary file creation with the new name
        try {
          await confirmFileCreation(file, name);
        } catch (error) {
          console.error('Failed to confirm file creation:', error);
        }
      } else {
        // Regular file name change
        const updatedFile = { ...file, name: name.endsWith('.md') ? name : `${name}.md` };
        saveFile(updatedFile);
      }
    }
  }, [files, saveFile, confirmFileCreation]);

  const handleCreateFile = useCallback(() => {
    try {
      // Create a temporary file that will be confirmed later
      const tempFile = createTemporaryFile();
      // The sidebar will handle the naming and confirmation
    } catch (error) {
      console.error('Failed to create temporary file:', error);
    }
  }, [createTemporaryFile]);

  const handleDeleteFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    
    // If it's a temporary file, just cancel it without confirmation
    if (file && file.id.startsWith('temp-')) {
      try {
        cancelFileCreation(file);
      } catch (error) {
        console.error('Failed to cancel file creation:', error);
      }
      return;
    }
    
    // For regular files, ask for context-aware confirmation
    if (file) {
      let confirmMessage: string;
      
      if (githubSync.isConnected) {
        // GitHub repository mode - more serious warning
        confirmMessage = `Delete "${file.name.replace('.md', '')}"?\n\nThis will permanently delete the file and all its contents from your GitHub repository. This action cannot be undone.`;
      } else {
        // Local storage mode - simpler confirmation
        confirmMessage = `Delete "${file.name.replace('.md', '')}"?\n\nThis will remove the file from your local storage.`;
      }
      
      if (window.confirm(confirmMessage)) {
        try {
          await deleteFile(fileId);
        } catch (error) {
          console.error('Failed to delete file:', error);
        }
      }
    }
  }, [deleteFile, cancelFileCreation, files, githubSync.isConnected]);

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
        
        <div className="flex items-center space-x-4">
          <AutoSaveIndicator status={status} lastSaved={lastSaved} />
          
          {githubSync.isConnected && (
            <SyncIndicator
              status={githubSync.syncStatus}
              lastSynced={githubSync.lastSynced || undefined}
              onManualSync={() => githubSync.manualSync(files)}
              onResolveConflicts={() => setShowConflictResolution(true)}
            />
          )}
          
          <SettingsPanel
            onConnectionChange={githubSync.handleConnectionChange}
            onClearDataForDisconnect={clearAllData}
            onReloadFiles={refreshFiles}
            onCloseSidebar={() => setSidebarVisible(false)}
            localFiles={files}
          />
        </div>
      </header>


      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          files={files}
          currentFile={currentFile}
          onFileSelect={selectFile}
          onFileCreate={handleCreateFile}
          onFileDelete={handleDeleteFile}
          onFileNameChange={handleFileNameChange}
          visible={sidebarVisible}
          onToggle={toggleSidebar}
        />
        
        <EditorCanvas
          file={currentFile}
          onContentChange={handleContentChange}
          onSidebarToggle={toggleSidebar}
          sidebarVisible={sidebarVisible}
        />
      </div>

      {/* Conflict Resolution Dialog */}
      {showConflictResolution && githubSync.conflicts.length > 0 && (
        <ConflictResolution
          conflicts={githubSync.conflicts}
          onResolve={(resolvedFiles) => {
            githubSync.resolveConflicts(resolvedFiles);
            setShowConflictResolution(false);
          }}
          onCancel={() => setShowConflictResolution(false)}
        />
      )}
    </div>
  );
};
