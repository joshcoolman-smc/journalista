import { useState } from 'react';
import { JournalFile } from '../types/journal';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { FileText, Upload, Check, X } from 'lucide-react';

interface LocalEntryMigrationProps {
  localFiles: JournalFile[];
  onMigrate: (files: JournalFile[]) => Promise<void>;
  onSkip: () => void;
}

export const LocalEntryMigration = ({ 
  localFiles, 
  onMigrate, 
  onSkip 
}: LocalEntryMigrationProps) => {
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);

    try {
      await onMigrate(localFiles);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to migrate entries');
    } finally {
      setMigrating(false);
    }
  };

  if (success) {
    return (
      <div 
        className="p-4 rounded-lg border space-y-3"
        style={{ 
          backgroundColor: 'var(--zen-bg-secondary)',
          borderColor: 'var(--zen-border)'
        }}
      >
        <div className="flex items-center space-x-2">
          <Check className="w-5 h-5" style={{ color: 'var(--zen-accent)' }} />
          <h4 
            className="font-medium"
            style={{ color: 'var(--zen-text-primary)' }}
          >
            Migration Complete
          </h4>
        </div>
        <p 
          className="text-sm"
          style={{ color: 'var(--zen-text-secondary)' }}
        >
          {localFiles.length} journal entries have been successfully backed up to GitHub.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="p-4 rounded-lg border space-y-4"
      style={{ 
        backgroundColor: 'var(--zen-bg-secondary)',
        borderColor: 'var(--zen-border)'
      }}
    >
      <div className="flex items-center space-x-2">
        <Upload className="w-5 h-5" style={{ color: 'var(--zen-accent)' }} />
        <h4 
          className="font-medium"
          style={{ color: 'var(--zen-text-primary)' }}
        >
          Migrate Local Entries
        </h4>
      </div>

      <div 
        className="text-sm"
        style={{ color: 'var(--zen-text-secondary)' }}
      >
        You have <strong>{localFiles.length}</strong> journal entries stored locally. 
        Would you like to back them up to your GitHub repository?
      </div>

      {error && (
        <Alert>
          <AlertDescription style={{ color: 'var(--zen-text-error)' }}>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* File list preview */}
      <div 
        className="max-h-32 overflow-y-auto rounded border"
        style={{ 
          backgroundColor: 'var(--zen-bg-primary)',
          borderColor: 'var(--zen-border)'
        }}
      >
        {localFiles.slice(0, 5).map((file, index) => (
          <div 
            key={file.id}
            className="flex items-center space-x-2 p-2 border-b last:border-b-0"
            style={{ borderColor: 'var(--zen-border)' }}
          >
            <FileText className="w-4 h-4" style={{ color: 'var(--zen-text-muted)' }} />
            <span 
              className="text-sm truncate"
              style={{ color: 'var(--zen-text-primary)' }}
            >
              {file.name}
            </span>
          </div>
        ))}
        {localFiles.length > 5 && (
          <div 
            className="p-2 text-xs text-center"
            style={{ color: 'var(--zen-text-muted)' }}
          >
            and {localFiles.length - 5} more entries...
          </div>
        )}
      </div>

      <div 
        className="text-xs"
        style={{ color: 'var(--zen-text-muted)' }}
      >
        <strong>What happens during migration:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Your local entries will be uploaded to the GitHub repository</li>
          <li>Local entries will remain on your device</li>
          <li>Future changes will be automatically synced with GitHub</li>
          <li>You can safely use your journal across multiple devices</li>
        </ul>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={handleMigrate}
          disabled={migrating}
          style={{ 
            backgroundColor: 'var(--zen-accent)',
            color: 'white'
          }}
        >
          {migrating ? 'Migrating...' : `Migrate ${localFiles.length} Entries`}
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={migrating}
          style={{ color: 'var(--zen-text-secondary)' }}
        >
          <X className="w-4 h-4 mr-1" />
          Skip Migration
        </Button>
      </div>
    </div>
  );
};