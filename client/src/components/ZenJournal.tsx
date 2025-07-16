import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { EditorCanvas } from './EditorCanvas';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { GitHubConnection } from './GitHubConnection';
import { SyncIndicator } from './SyncIndicator';
import { ConflictResolution } from './ConflictResolution';
import { PrivacyNotice } from './PrivacyNotice';
import { DataManagement } from './DataManagement';
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
    selectFile,
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

  const handleFileNameChange = useCallback((fileId: string, name: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const updatedFile = { ...file, name: name.endsWith('.md') ? name : `${name}.md` };
      saveFile(updatedFile);
    }
  }, [files, saveFile]);

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

  const handleClearAllData = useCallback(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Disconnect from GitHub
    githubSync.handleConnectionChange(false);
    
    // Reload the page to reset all state
    window.location.reload();
  }, [githubSync]);

  const handleExportData = useCallback(() => {
    const exportData = {
      files: files.map(file => ({
        name: file.name,
        content: file.content,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString()
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zen-journal-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files]);

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
              lastSynced={githubSync.lastSynced}
              onManualSync={() => githubSync.manualSync(files)}
              onResolveConflicts={() => setShowConflictResolution(true)}
            />
          )}
          
          <GitHubConnection onConnectionChange={githubSync.handleConnectionChange} />
          
          <DataManagement 
            onClearAllData={handleClearAllData}
            onExportData={handleExportData}
          />
        </div>
      </header>

      {/* Privacy Notice */}
      <div className="px-6 py-2">
        <PrivacyNotice />
      </div>

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
