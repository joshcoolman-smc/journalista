import { useState } from 'react';
import { JournalFile } from '../types/journal';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ConflictResolutionProps {
  conflicts: JournalFile[];
  onResolve: (resolvedFiles: JournalFile[]) => void;
  onCancel: () => void;
}

interface ConflictChoice {
  fileId: string;
  choice: 'local' | 'remote' | 'manual';
  content?: string;
}

export const ConflictResolution = ({ conflicts, onResolve, onCancel }: ConflictResolutionProps) => {
  const [choices, setChoices] = useState<ConflictChoice[]>(
    conflicts.map(file => ({ fileId: file.id, choice: 'local' as const }))
  );
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);

  const currentConflict = conflicts[currentConflictIndex];
  const currentChoice = choices.find(c => c.fileId === currentConflict.id);

  const handleChoiceChange = (choice: ConflictChoice['choice']) => {
    setChoices(prev => prev.map(c => 
      c.fileId === currentConflict.id ? { ...c, choice } : c
    ));
  };

  const handleManualEdit = (content: string) => {
    setChoices(prev => prev.map(c => 
      c.fileId === currentConflict.id ? { ...c, choice: 'manual', content } : c
    ));
  };

  const handleResolve = () => {
    const resolvedFiles = conflicts.map(conflict => {
      const choice = choices.find(c => c.fileId === conflict.id);
      
      if (choice?.choice === 'manual' && choice.content) {
        return { ...conflict, content: choice.content, updatedAt: new Date() };
      }
      
      // For now, we'll just return the local version since we don't have remote version
      // In a real implementation, you'd need to fetch the remote version
      return conflict;
    });

    onResolve(resolvedFiles);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[80vh]" style={{ backgroundColor: 'var(--zen-bg-primary)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--zen-text-primary)' }}>
            Resolve Conflicts ({currentConflictIndex + 1} of {conflicts.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium" style={{ color: 'var(--zen-text-primary)' }}>
              {currentConflict.name}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentConflictIndex(Math.max(0, currentConflictIndex - 1))}
                disabled={currentConflictIndex === 0}
                style={{ borderColor: 'var(--zen-border)' }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentConflictIndex(Math.min(conflicts.length - 1, currentConflictIndex + 1))}
                disabled={currentConflictIndex === conflicts.length - 1}
                style={{ borderColor: 'var(--zen-border)' }}
              >
                Next
              </Button>
            </div>
          </div>

          <Tabs value={currentChoice?.choice} onValueChange={handleChoiceChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="local">Keep Local</TabsTrigger>
              <TabsTrigger value="remote">Keep Remote</TabsTrigger>
              <TabsTrigger value="manual">Edit Manually</TabsTrigger>
            </TabsList>

            <TabsContent value="local" className="space-y-4">
              <div className="text-sm" style={{ color: 'var(--zen-text-secondary)' }}>
                Keep your local version of this file
              </div>
              <ScrollArea className="h-64 w-full border rounded-md p-4" style={{ borderColor: 'var(--zen-border)' }}>
                <MarkdownRenderer content={currentConflict.content} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="remote" className="space-y-4">
              <div className="text-sm" style={{ color: 'var(--zen-text-secondary)' }}>
                Keep the remote version from GitHub
              </div>
              <ScrollArea className="h-64 w-full border rounded-md p-4" style={{ borderColor: 'var(--zen-border)' }}>
                <div className="text-sm" style={{ color: 'var(--zen-text-muted)' }}>
                  Remote version would be loaded here
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="text-sm" style={{ color: 'var(--zen-text-secondary)' }}>
                Edit the content manually to resolve conflicts
              </div>
              <textarea
                value={currentChoice?.content || currentConflict.content}
                onChange={(e) => handleManualEdit(e.target.value)}
                className="w-full h-64 p-4 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--zen-bg-secondary)',
                  borderColor: 'var(--zen-border)',
                  color: 'var(--zen-text-primary)',
                  '--tw-ring-color': 'var(--zen-accent)'
                }}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm" style={{ color: 'var(--zen-text-secondary)' }}>
              {choices.filter(c => c.choice !== 'local').length} of {conflicts.length} conflicts resolved
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                style={{ borderColor: 'var(--zen-border)' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                style={{ backgroundColor: 'var(--zen-accent)', color: 'white' }}
              >
                Resolve All Conflicts
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};