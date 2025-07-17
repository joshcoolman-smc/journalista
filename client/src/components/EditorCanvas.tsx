import { useState, useRef, useEffect } from 'react';
import { JournalFile } from '../types/journal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Copy, Menu, Code, Columns } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface EditorCanvasProps {
  file: JournalFile | null;
  onContentChange: (content: string) => void;
  onSidebarToggle: () => void;
  sidebarVisible: boolean;
}

export const EditorCanvas = ({ 
  file, 
  onContentChange, 
  onSidebarToggle, 
  sidebarVisible 
}: EditorCanvasProps) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [liveContent, setLiveContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && file) {
      console.log('EditorCanvas received file:', {
        id: file.id,
        name: file.name,
        contentLength: file.content?.length || 0,
        contentPreview: file.content?.substring(0, 100) || 'No content'
      });
      textareaRef.current.value = file.content;
      setLiveContent(file.content);
    }
  }, [file?.id]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLiveContent(newContent); // Update live preview immediately
    onContentChange(newContent); // This will trigger auto-save debounced
  };



  const getWordCount = (content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  // Use live content for preview to show real-time updates
  const previewContent = liveContent || file?.content || '';

  const copyToClipboard = async () => {
    if (!file) return;
    
    try {
      await navigator.clipboard.writeText(file.content);
      // You could add a toast notification here if needed
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
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
              onClick={() => setViewMode('split')}
              className="transition-zen"
              style={{ color: viewMode === 'split' ? 'var(--zen-accent)' : 'var(--zen-text-muted)' }}
              title="Split View"
            >
              <Columns className="h-4 w-4" />
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
            <div className="w-px h-6 bg-gray-600 mx-2"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="transition-zen"
              style={{ color: 'var(--zen-text-muted)' }}
              title="Copy to Clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Show file name when sidebar is collapsed */}
          {!sidebarVisible && (
            <div className="text-sm font-medium" style={{ color: 'var(--zen-text-primary)' }}>
              {file.name.replace('.md', '')}
            </div>
          )}
        </div>
      </div>

      {/* Writing Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' && (
          <div className="h-full flex flex-col">
            <div 
              className="px-4 py-2 text-xs font-medium border-b flex items-center justify-between"
              style={{
                backgroundColor: 'var(--zen-bg-secondary)',
                borderColor: 'var(--zen-border)',
                color: 'var(--zen-text-muted)',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              <span>Markdown Editor</span>
              <span>{getWordCount(file.content)} words</span>
            </div>
            <textarea
              ref={textareaRef}
              className="flex-1 w-full resize-none focus:outline-none p-8"
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
          <div className="h-full flex flex-col">
            <div 
              className="px-4 py-2 text-xs font-medium border-b"
              style={{
                backgroundColor: 'var(--zen-bg-secondary)',
                borderColor: 'var(--zen-border)',
                color: 'var(--zen-text-muted)',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              Preview
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <MarkdownRenderer content={previewContent} />
                {!previewContent.trim() && (
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
          </div>
        )}

        {viewMode === 'split' && (
          <div className="h-full flex">
            {/* Left side - Editor */}
            <div className="w-1/2 flex flex-col" style={{ borderRight: '1px solid var(--zen-border)' }}>
              <div 
                className="px-4 py-2 text-xs font-medium border-b flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--zen-bg-secondary)',
                  borderColor: 'var(--zen-border)',
                  color: 'var(--zen-text-muted)',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                <span>Markdown Editor</span>
                <span>{getWordCount(previewContent)} words</span>
              </div>
              <textarea
                ref={textareaRef}
                className="flex-1 w-full resize-none focus:outline-none p-4"
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
            <div className="w-1/2 flex flex-col">
              <div 
                className="px-4 py-2 text-xs font-medium border-b"
                style={{
                  backgroundColor: 'var(--zen-bg-secondary)',
                  borderColor: 'var(--zen-border)',
                  color: 'var(--zen-text-muted)',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                Preview
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="max-w-full">
                  <MarkdownRenderer content={previewContent} />
                  {!previewContent.trim() && (
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
          </div>
        )}
      </div>
    </main>
  );
};
