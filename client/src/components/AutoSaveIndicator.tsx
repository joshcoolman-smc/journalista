import { AutoSaveIndicatorProps } from '../types/journal';

export const AutoSaveIndicator = ({ status, lastSaved }: AutoSaveIndicatorProps) => {
  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Auto-saved';
      case 'error':
        return 'Save failed';
      default:
        return 'Auto-saved';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'saving':
        return 'text-yellow-500';
      case 'saved':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-green-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return '⏳';
      case 'saved':
        return '✓';
      case 'error':
        return '⚠️';
      default:
        return '✓';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--zen-text-muted)' }}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
      </div>
      {lastSaved && status === 'saved' && (
        <span className="text-xs">
          {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
