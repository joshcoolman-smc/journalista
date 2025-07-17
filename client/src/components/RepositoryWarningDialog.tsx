import { RepositoryAnalysis } from '../types/journal';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, FolderPlus, GitBranch } from 'lucide-react';

interface RepositoryWarningDialogProps {
  repositoryName: string;
  analysis: RepositoryAnalysis;
  onContinue: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RepositoryWarningDialog = ({
  repositoryName,
  analysis,
  onContinue,
  onCreateNew,
  onCancel,
  isLoading = false
}: RepositoryWarningDialogProps) => {
  // Only show warning for development repositories
  if (analysis.type !== 'development') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
        style={{ 
          backgroundColor: 'var(--zen-bg-primary)',
          borderColor: 'var(--zen-border)'
        }}
      >
        {/* Header */}
        <div className="flex items-center space-x-3">
          <AlertTriangle 
            className="w-6 h-6 flex-shrink-0" 
            style={{ color: 'var(--zen-accent)' }} 
          />
          <h3 
            className="text-lg font-semibold"
            style={{ color: 'var(--zen-text-primary)' }}
          >
            Repository Context Notice
          </h3>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <Alert>
            <AlertDescription>
              <div 
                className="text-sm space-y-2"
                style={{ color: 'var(--zen-text-primary)' }}
              >
                <p>
                  <strong className="font-medium">{repositoryName}</strong> appears to be a development project.
                </p>
                
                <p>Adding journal entries will:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create an <code className="bg-gray-100 px-1 rounded text-xs">entries/</code> folder at the repository root</li>
                  <li>Store all journal files as .md files in that folder</li>
                  <li>Make your personal notes part of this project</li>
                </ul>

                {analysis.indicators.developmentFileTypes.length > 0 && (
                  <p className="text-xs mt-2" style={{ color: 'var(--zen-text-muted)' }}>
                    <strong>Detected files:</strong> {analysis.indicators.developmentFileTypes.slice(0, 3).join(', ')}
                    {analysis.indicators.developmentFileTypes.length > 3 && ` and ${analysis.indicators.developmentFileTypes.length - 3} more`}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div 
            className="text-sm"
            style={{ color: 'var(--zen-text-secondary)' }}
          >
            Would you like to:
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={onContinue}
            disabled={isLoading}
            className="w-full justify-start"
            variant="outline"
            style={{ 
              borderColor: 'var(--zen-border)',
              color: 'var(--zen-text-primary)'
            }}
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Continue with {repositoryName}
          </Button>

          <Button
            onClick={onCreateNew}
            disabled={isLoading}
            className="w-full justify-start"
            style={{ 
              backgroundColor: 'var(--zen-accent)',
              color: 'white'
            }}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Create a dedicated journal repository instead
          </Button>

          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="ghost"
            className="w-full"
            style={{ color: 'var(--zen-text-secondary)' }}
          >
            Choose a different repository
          </Button>
        </div>

        {isLoading && (
          <div 
            className="text-center text-sm"
            style={{ color: 'var(--zen-text-muted)' }}
          >
            Connecting...
          </div>
        )}
      </div>
    </div>
  );
};