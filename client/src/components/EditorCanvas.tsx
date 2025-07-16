import { useState, useRef, useEffect } from 'react';
import { JournalFile } from '../types/journal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Download, Menu, Code } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FormattingToolbar } from './FormattingToolbar';
import { useTextSelection } from '../hooks/useTextSelection';

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
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selection, cursorPosition, formatText } = useTextSelection(textareaRef);

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
            {!sidebarVisible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSidebarToggle}
                className="transition-zen"
                style={{ color: 'var(--zen-text-secondary)' }}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
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
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="transition-zen"
              style={{ color: isPreviewMode ? 'var(--zen-text-muted)' : 'var(--zen-accent)' }}
              title={isPreviewMode ? 'Edit Markdown' : 'Preview'}
            >
              {isPreviewMode ? <Code className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
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
        {isPreviewMode ? (
          <div className="h-full p-8 overflow-y-auto relative">
            <div className="max-w-4xl mx-auto">
              {/* Textarea for editing in preview mode */}
              <textarea
                ref={textareaRef}
                className="absolute inset-0 w-full h-full bg-transparent resize-none focus:outline-none zen-content transition-all duration-200"
                defaultValue={file.content}
                onChange={handleContentChange}
                onBlur={() => {
                  if (textareaRef.current) {
                    textareaRef.current.style.pointerEvents = 'none';
                    textareaRef.current.style.opacity = '0';
                    textareaRef.current.style.color = 'transparent';
                  }
                }}
                style={{
                  color: 'transparent',
                  minHeight: 'calc(100vh - 200px)',
                  fontFamily: 'Crimson Text, serif',
                  fontSize: '18px',
                  lineHeight: '1.7',
                  letterSpacing: '0.01em',
                  zIndex: 10,
                  opacity: 0,
                  pointerEvents: 'none'
                }}
              />
              
              {/* Rendered markdown - clickable to focus textarea */}
              <div 
                className="relative cursor-text"
                onClick={() => {
                  if (textareaRef.current) {
                    textareaRef.current.style.pointerEvents = 'auto';
                    textareaRef.current.style.opacity = '0.1';
                    textareaRef.current.style.color = 'var(--zen-text-primary)';
                    textareaRef.current.focus();
                  }
                }}
                style={{ zIndex: 2 }}
              >
                <MarkdownRenderer content={file.content} />
                
                {/* Subtle hint when content is empty */}
                {!file.content.trim() && (
                  <div 
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ 
                      color: 'var(--zen-text-muted)',
                      fontFamily: 'Crimson Text, serif',
                      fontSize: '18px',
                      lineHeight: '1.7',
                      letterSpacing: '0.01em'
                    }}
                  >
                    Click here to start writing...
                  </div>
                )}
              </div>
              
              {/* Formatting Toolbar */}
              <FormattingToolbar
                onFormat={formatText}
                position={cursorPosition}
                visible={!!selection && isPreviewMode}
              />
            </div>
          </div>
        ) : (
          <div className="h-full p-8 overflow-y-auto relative">
            <div className="max-w-4xl mx-auto">
              <div className="markdown-editor-container">
                <div className="markdown-editor-header"></div>
                <textarea
                  ref={textareaRef}
                  className="w-full markdown-editor bg-transparent resize-none focus:outline-none"
                  placeholder="# Start writing your thoughts...\n\nUse **bold** and *italic* text\n- Create bullet lists\n1. Or numbered lists\n\n> Add blockquotes for emphasis"
                  defaultValue={file.content}
                  onChange={handleContentChange}
                  style={{
                    minHeight: 'calc(100vh - 300px)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    border: 'none',
                    borderRadius: '0 0 8px 8px'
                  }}
                />
              </div>
              
              {/* Formatting Toolbar */}
              <FormattingToolbar
                onFormat={formatText}
                position={cursorPosition}
                visible={!!selection && !isPreviewMode}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
