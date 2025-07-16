import { Alert, AlertDescription } from './ui/alert';
import { Shield, Info } from 'lucide-react';

export const PrivacyNotice = () => {
  return (
    <Alert className="mb-4" style={{ backgroundColor: 'var(--zen-bg-secondary)', borderColor: 'var(--zen-border)' }}>
      <Info className="h-4 w-4" style={{ color: 'var(--zen-accent)' }} />
      <AlertDescription style={{ color: 'var(--zen-text-secondary)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-3 w-3" style={{ color: 'var(--zen-accent)' }} />
          <span className="font-medium">Privacy-First Design</span>
        </div>
        Your journal entries are stored locally on your device. GitHub integration is optional and uses your personal repositories. 
        Use trusted devices when connecting to GitHub.
      </AlertDescription>
    </Alert>
  );
};