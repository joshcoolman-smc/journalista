import { formatDistanceToNow } from 'date-fns';
import { SyncIndicatorProps } from '../types/journal';
import { Button } from './ui/button';
import { RefreshCw, Check, AlertCircle, GitPullRequest } from 'lucide-react';

export const SyncIndicator = ({ 
  status, 
  lastSynced, 
  onManualSync, 
  onResolveConflicts 
}: SyncIndicatorProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'synced':
        return <Check className="w-4 h-4" style={{ color: 'var(--zen-accent)' }} />;
      case 'error':
        return <AlertCircle className="w-4 h-4" style={{ color: 'var(--zen-text-error)' }} />;
      case 'conflict':
        return <GitPullRequest className="w-4 h-4" style={{ color: 'var(--zen-text-warning)' }} />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return lastSynced ? `Synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}` : 'Synced';
      case 'error':
        return 'Sync failed';
      case 'conflict':
        return 'Conflicts detected';
      default:
        return 'Not synced';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'synced':
        return 'var(--zen-accent)';
      case 'error':
        return 'var(--zen-text-error)';
      case 'conflict':
        return 'var(--zen-text-warning)';
      default:
        return 'var(--zen-text-secondary)';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm" style={{ color: getStatusColor() }}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      
      {status !== 'syncing' && (
        <div className="flex items-center gap-1">
          {status === 'conflict' && onResolveConflicts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResolveConflicts}
              className="transition-zen focus-ring text-xs"
              style={{ color: 'var(--zen-text-warning)' }}
            >
              Resolve
            </Button>
          )}
          
          {onManualSync && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onManualSync}
              className="transition-zen focus-ring"
              style={{ color: 'var(--zen-text-secondary)' }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};