import { useState, useEffect } from 'react';
import { JournalFile } from '../types/journal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, File, Trash2, Search, Edit3 } from 'lucide-react';

interface SidebarProps {
  files: JournalFile[];
  currentFile: JournalFile | null;
  onFileSelect: (file: JournalFile) => void;
  onFileCreate: () => void;
  onFileDelete: (fileId: string) => void;
  onFileNameChange: (fileId: string, newName: string) => void;
  visible: boolean;
  onToggle: () => void;
}

export const Sidebar = ({
  files,
  currentFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileNameChange,
  visible
}: SidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleEditStart = (file: JournalFile) => {
    setEditingFileId(file.id);
    const baseName = file.name.replace('.md', '');
    setEditingFileName(baseName);
    
    // For temporary files, we want to select all text so user can type over it
    setTimeout(() => {
      const input = document.querySelector(`input[value="${baseName}"]`) as HTMLInputElement;
      if (input) {
        input.select();
      }
    }, 0);
  };

  const handleEditComplete = () => {
    if (editingFileId && editingFileName.trim()) {
      // Check if this is a temporary file
      const file = files.find(f => f.id === editingFileId);
      if (file && file.id.startsWith('temp-')) {
        // For temporary files, we need to confirm creation
        // This should be handled by the parent component
        onFileNameChange(editingFileId, editingFileName.trim());
      } else {
        // For regular files, just update the name
        onFileNameChange(editingFileId, editingFileName.trim());
      }
    }
    setEditingFileId(null);
    setEditingFileName('');
  };

  // Auto-start editing for new temporary files
  useEffect(() => {
    if (files.length > 0) {
      const latestFile = files[0];
      // Check if this is a temporary file (id starts with 'temp-')
      if (latestFile.id.startsWith('temp-')) {
        handleEditStart(latestFile);
      }
    }
  }, [files.length]);

  const handleEditCancel = () => {
    // If canceling a temporary file, we need to remove it
    if (editingFileId) {
      const file = files.find(f => f.id === editingFileId);
      if (file && file.id.startsWith('temp-')) {
        // Remove the temporary file
        onFileDelete(editingFileId);
      }
    }
    setEditingFileId(null);
    setEditingFileName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditComplete();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  if (!visible) return null;

  return (
    <aside 
      className="w-80 flex flex-col transition-all duration-300 ease-in-out"
      style={{ 
        backgroundColor: 'var(--zen-bg-secondary)',
        borderRight: '1px solid var(--zen-border)'
      }}
    >
      {/* Header */}
      <div className="px-6" style={{ borderBottom: '1px solid var(--zen-border)', paddingTop: '18px', paddingBottom: '18px' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium" style={{ color: 'var(--zen-text-primary)' }}>
            Files
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFileCreate}
            className="hover:bg-opacity-20 transition-zen"
            style={{ color: 'var(--zen-text-secondary)' }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search - only show if there are more than 10 files */}
        {files.length > 10 && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'var(--zen-text-muted)' }} />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-zen focus-ring"
              style={{
                backgroundColor: 'var(--zen-bg-tertiary)',
                color: 'var(--zen-text-primary)',
                border: '1px solid var(--zen-border)'
              }}
            />
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <File className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--zen-text-muted)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--zen-text-muted)' }}>
              {searchTerm ? 'No files match your search' : 'No journal entries yet'}
            </p>
            {!searchTerm && (
              <p className="text-xs" style={{ color: 'var(--zen-text-muted)' }}>
                Click the + button above to create your first entry
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`group p-3 rounded-lg cursor-pointer transition-zen ${
                  currentFile?.id === file.id 
                    ? 'border' 
                    : 'hover:bg-opacity-50'
                }`}
                style={{
                  backgroundColor: currentFile?.id === file.id 
                    ? 'var(--zen-bg-tertiary)' 
                    : 'transparent',
                  borderColor: currentFile?.id === file.id 
                    ? 'var(--zen-accent)' 
                    : 'transparent'
                }}
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStart(file);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-zen p-0 h-4 w-4 flex-shrink-0"
                      style={{ color: 'var(--zen-text-muted)' }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      {editingFileId === file.id ? (
                        <Input
                          type="text"
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          onBlur={handleEditComplete}
                          onKeyDown={handleKeyDown}
                          className="text-sm font-medium bg-transparent border-0 border-b-2 border-transparent focus:border-b-2 focus:ring-0 px-0 rounded-none transition-zen"
                          style={{
                            color: 'var(--zen-text-primary)',
                            borderBottomColor: 'var(--zen-accent)'
                          }}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="font-medium truncate"
                          style={{ color: 'var(--zen-text-primary)' }}
                        >
                          {file.name.replace('.md', '')}
                        </div>
                      )}
                      <div 
                        className="text-sm"
                        style={{ color: 'var(--zen-text-muted)' }}
                      >
                        {formatDate(file.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileDelete(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-zen hover:text-red-400"
                    style={{ color: 'var(--zen-text-muted)' }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
