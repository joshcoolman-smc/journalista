import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { Button } from './ui/button';
import { GitHubConnectionNew } from './GitHubConnectionNew';
import { JournalFile } from '../types/journal';

interface SettingsPanelProps {
  onConnectionChange: (connected: boolean) => void;
  onClearDataForDisconnect?: () => void;
  onReloadFiles?: () => void;
  onCloseSidebar?: () => void;
  localFiles?: JournalFile[];
}

export const SettingsPanel = ({ 
  onConnectionChange, 
  onClearDataForDisconnect,
  onReloadFiles,
  onCloseSidebar,
  localFiles = []
}: SettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Settings trigger button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="transition-zen focus-ring"
        style={{ color: 'var(--zen-text-secondary)' }}
      >
        <Settings className="w-4 h-4" />
      </Button>

      {/* Settings panel overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Settings panel */}
          <div 
            className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col shadow-xl"
            style={{ backgroundColor: 'var(--zen-bg-primary)' }}
          >
            {/* Panel header */}
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--zen-border)' }}
            >
              <h2 
                className="text-lg font-medium"
                style={{ color: 'var(--zen-text-primary)' }}
              >
                Settings
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="transition-zen focus-ring"
                style={{ color: 'var(--zen-text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* GitHub Connection Section */}
              <div>
                <h3 
                  className="text-sm font-medium mb-3"
                  style={{ color: 'var(--zen-text-secondary)' }}
                >
                  GitHub Integration
                </h3>
                <GitHubConnectionNew 
                  onConnectionChange={onConnectionChange}
                  onClearAllData={onClearDataForDisconnect}
                  onReloadFiles={onReloadFiles}
                  onCloseSidebar={onCloseSidebar}
                  localFiles={localFiles}
                />
              </div>

            </div>
          </div>
        </>
      )}
    </>
  );
};