import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Trash2, Download, AlertTriangle } from 'lucide-react';

interface DataManagementProps {
  onClearAllData: () => void;
  onExportData: () => void;
}

export const DataManagement = ({ onClearAllData, onExportData }: DataManagementProps) => {
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearData = () => {
    onClearAllData();
    setShowClearDialog(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onExportData}
        className="transition-zen focus-ring"
        style={{ color: 'var(--zen-text-secondary)' }}
      >
        <Download className="w-4 h-4 mr-2" />
        Export Data
      </Button>
      
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="transition-zen focus-ring"
            style={{ color: 'var(--zen-text-secondary)' }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'var(--zen-bg-primary)' }} aria-describedby="clear-data-description">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--zen-text-primary)' }}>
              Clear All Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div id="clear-data-description" className="text-sm" style={{ color: 'var(--zen-text-secondary)' }}>
              This will permanently delete all your journal entries and disconnect from GitHub.
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" style={{ color: 'var(--zen-text-warning)' }} />
              <AlertDescription style={{ color: 'var(--zen-text-warning)' }}>
                This action cannot be undone. Make sure you have backups in GitHub if needed.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
                style={{ 
                  borderColor: 'var(--zen-border)',
                  color: 'var(--zen-text-secondary)'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearData}
                style={{ 
                  backgroundColor: 'var(--zen-text-error)',
                  color: 'white'
                }}
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};