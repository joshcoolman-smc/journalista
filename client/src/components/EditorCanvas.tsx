import { useState, useRef, useEffect } from 'react';
import { JournalFile } from '../types/journal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Download, Menu, Code, Columns } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface EditorCanvasProps {
  file: JournalFile | null;
  onContentChange: (content: string) => void;
  onSidebarToggle: () => void;
  onFileNameChange: (name: string) => void;
  sidebarVisible: boolean;
}

export const EditorCanvas = ({ 
  file, 
  onContentChange, 
  onSidebarToggle, 
  onFileNameChange,
  sidebarVisible 
}: EditorCanvasProps) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && file) {
      textareaRef.current.value = file.content;
    }
  }, [file?.id]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    onFileNameChange(newName.endsWith('.md') ? newName : `${newName}.md`);
  };

  const getWordCount = (content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const exportFile = () => {
    if (!file) return;
    
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!file) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4" style={{ color: 'var(--zen-text-primary)' }}>
            Welcome to Zen Journal
          </h2>
          <p className="text-lg mb-6" style={{ color: 'var(--zen-text-muted)' }}>
            Create a new journal entry to start writing
          </p>
          {!sidebarVisible && (
            <Button
              onClick={onSidebarToggle}
              className="transition-zen"
              style={{
                backgroundColor: 'var(--zen-accent)',
                color: 'white'
              }}
            >
              <Menu className="h-4 w-4 mr-2" />
              Open Files
            </Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Header */}
      <div 
        className="px-8 py-4 border-b"
        style={{ 
          borderColor: 'var(--zen-border)',
          backgroundColor: 'var(--zen-bg-secondary)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={file.name.replace('.md', '')}
              onChange={handleFileNameChange}
              className="text-lg font-medium bg-transparent border-0 border-b-2 border-transparent focus:border-b-2 focus:ring-0 px-0 rounded-none transition-zen"
              style={{
                color: 'var(--zen-text-primary)',
                borderBottomColor: 'transparent'
              }}
            />
            <div className="text-sm" style={{ color: 'var(--zen-text-muted)' }}>
              {getWordCount(file.content)} words
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('edit')}
              className="transition-zen"
              style={{ color: viewMode === 'edit' ? 'var(--zen-accent)' : 'var(--zen-text-muted)' }}
              title="Edit Markdown"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('preview')}
              className="transition-zen"
              style={{ color: viewMode === 'preview' ? 'var(--zen-accent)' : 'var(--zen-text-muted)' }}
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('split')}
              className="transition-zen"
              style={{ color: viewMode === 'split' ? 'var(--zen-accent)' : 'var(--zen-text-muted)' }}
              title="Split View"
            >
              <Columns className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-600 mx-2"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportFile}
              className="transition-zen"
              style={{ color: 'var(--zen-text-muted)' }}
              title="Export as Markdown"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Writing Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' && (
          <div className="h-full overflow-y-auto relative">
            <textarea
              ref={textareaRef}
              className="w-full h-full resize-none focus:outline-none p-8"
              defaultValue={file.content}
              onChange={handleContentChange}
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                border: 'none',
                backgroundColor: 'var(--zen-bg-tertiary)',
                color: 'var(--zen-text-primary)'
              }}
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="h-full p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <MarkdownRenderer content={file.content} />
              {!file.content.trim() && (
                <div 
                  className="text-center py-12"
                  style={{ color: 'var(--zen-text-muted)' }}
                >
                  <p className="text-lg">No content to preview</p>
                  <p className="text-sm mt-2">Switch to edit mode to start writing</p>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="h-full flex">
            {/* Left side - Editor */}
            <div className="w-1/2 overflow-y-auto" style={{ borderRight: '1px solid var(--zen-border)' }}>
              <textarea
                ref={textareaRef}
                className="w-full h-full resize-none focus:outline-none p-4"
                defaultValue={file.content}
                onChange={handleContentChange}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  border: 'none',
                  backgroundColor: 'var(--zen-bg-tertiary)',
                  color: 'var(--zen-text-primary)'
                }}
              />
            </div>
            
            {/* Right side - Preview */}
            <div className="w-1/2 p-4 overflow-y-auto">
              <div className="max-w-full">
                <MarkdownRenderer content={file.content} />
                {!file.content.trim() && (
                  <div 
                    className="text-center py-12"
                    style={{ color: 'var(--zen-text-muted)' }}
                  >
                    <p className="text-lg">Live preview</p>
                    <p className="text-sm mt-2">Start typing to see your markdown rendered</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
