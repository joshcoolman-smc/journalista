import { useState } from 'react';
import { GitHubConfig } from '../types/journal';
import { githubSync } from '../services/githubSync';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Github, Unlink, ExternalLink } from 'lucide-react';

interface GitHubConnectionProps {
  onConnectionChange: (connected: boolean) => void;
}

export const GitHubConnection = ({ onConnectionChange }: GitHubConnectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<GitHubConfig>({
    token: '',
    repo: '',
    owner: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(githubSync.isConnected());

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await githubSync.connect(config);
      setIsConnected(true);
      setIsOpen(false);
      onConnectionChange(true);
      setConfig({ token: '', repo: '', owner: '' }); // Clear form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to GitHub');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    githubSync.disconnect();
    setIsConnected(false);
    onConnectionChange(false);
  };

  const handleInputChange = (field: keyof GitHubConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--zen-text-secondary)' }}>
          <Github className="w-4 h-4" style={{ color: 'var(--zen-accent)' }} />
          Connected to GitHub
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="transition-zen focus-ring"
          style={{ color: 'var(--zen-text-secondary)' }}
        >
          <Unlink className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="transition-zen focus-ring"
          style={{ color: 'var(--zen-text-secondary)' }}
        >
          <Github className="w-4 h-4 mr-2" />
          Connect GitHub
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'var(--zen-bg-primary)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--zen-text-primary)' }}>
            Connect to GitHub
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm" style={{ color: 'var(--zen-text-secondary)' }}>
            Your journal entries will be backed up to a GitHub repository as markdown files.
          </div>

          {error && (
            <Alert>
              <AlertDescription style={{ color: 'var(--zen-text-error)' }}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="owner" style={{ color: 'var(--zen-text-secondary)' }}>
                GitHub Username/Organization
              </Label>
              <Input
                id="owner"
                value={config.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                placeholder="your-username"
                className="mt-1"
                style={{ 
                  backgroundColor: 'var(--zen-bg-secondary)',
                  borderColor: 'var(--zen-border)',
                  color: 'var(--zen-text-primary)'
                }}
              />
            </div>

            <div>
              <Label htmlFor="repo" style={{ color: 'var(--zen-text-secondary)' }}>
                Repository Name
              </Label>
              <Input
                id="repo"
                value={config.repo}
                onChange={(e) => handleInputChange('repo', e.target.value)}
                placeholder="my-journal"
                className="mt-1"
                style={{ 
                  backgroundColor: 'var(--zen-bg-secondary)',
                  borderColor: 'var(--zen-border)',
                  color: 'var(--zen-text-primary)'
                }}
              />
            </div>

            <div>
              <Label htmlFor="token" style={{ color: 'var(--zen-text-secondary)' }}>
                Personal Access Token
              </Label>
              <Input
                id="token"
                type="password"
                value={config.token}
                onChange={(e) => handleInputChange('token', e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="mt-1"
                style={{ 
                  backgroundColor: 'var(--zen-bg-secondary)',
                  borderColor: 'var(--zen-border)',
                  color: 'var(--zen-text-primary)'
                }}
              />
              <div className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--zen-text-muted)' }}>
                Need a token? 
                <a 
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Zen%20Journal"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline hover:no-underline"
                  style={{ color: 'var(--zen-accent)' }}
                >
                  Create one here
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              style={{ 
                borderColor: 'var(--zen-border)',
                color: 'var(--zen-text-secondary)'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !config.token || !config.repo || !config.owner}
              style={{ 
                backgroundColor: 'var(--zen-accent)',
                color: 'white'
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};