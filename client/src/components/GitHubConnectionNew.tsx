import { useState, useEffect } from 'react';
import { GitHubConfig, JournalFile, RepositoryAnalysis } from '../types/journal';
import { githubSync } from '../services/githubSync';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Github, Unlink, ExternalLink } from 'lucide-react';
import { RepositoryPicker } from './RepositoryPicker';
import { RepositoryWarningDialog } from './RepositoryWarningDialog';

interface GitHubConnectionNewProps {
  onConnectionChange: (connected: boolean) => void;
  onClearAllData?: () => void;
  onReloadFiles?: () => void;
  onCloseSidebar?: () => void;
  localFiles?: JournalFile[];
}

type ConnectionStep = 'disconnected' | 'token' | 'repository' | 'connected';

export const GitHubConnectionNew = ({ onConnectionChange, onClearAllData, onReloadFiles, onCloseSidebar, localFiles = [] }: GitHubConnectionNewProps) => {
  const [step, setStep] = useState<ConnectionStep>(
    githubSync.isConnected() ? 'connected' : 'disconnected'
  );
  const [token, setToken] = useState('');
  const [validatingToken, setValidatingToken] = useState(false);
  const [connectingToRepo, setConnectingToRepo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Repository analysis state
  const [pendingRepository, setPendingRepository] = useState<{ owner: string; repo: string } | null>(null);
  const [repositoryAnalysis, setRepositoryAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [analyzingRepository, setAnalyzingRepository] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const currentRepo = githubSync.getCurrentRepository();

  // Load stored token on mount (only if we have one)
  useEffect(() => {
    const storedToken = githubSync.getStoredToken();
    if (storedToken && !githubSync.isConnected()) {
      console.log('[GitHub] Found stored token, going to repository selection');
      setToken(storedToken);
      setStep('repository');
    } else {
      console.log('[GitHub] No stored token or already connected');
    }
  }, []);

  const handleTokenSubmit = async () => {
    if (!token.trim()) return;
    
    setValidatingToken(true);
    setError(null);

    try {
      const isValid = await githubSync.validateToken(token);
      if (isValid) {
        githubSync.storeToken(token);
        setStep('repository');
      } else {
        setError('Invalid GitHub token. Please check your token and try again.');
      }
    } catch (err) {
      setError('Failed to validate token. Please try again.');
    } finally {
      setValidatingToken(false);
    }
  };

  const handleRepositorySelect = async (owner: string, repo: string) => {
    setAnalyzingRepository(true);
    setError(null);
    setPendingRepository({ owner, repo });

    try {
      // Analyze the repository first
      const analysis = await githubSync.analyzeRepository(token, owner, repo);
      setRepositoryAnalysis(analysis);
      
      // If it's a development repository, show warning dialog
      if (analysis.type === 'development' && analysis.confidence > 0.5) {
        setShowWarningDialog(true);
      } else {
        // Proceed directly for journal-appropriate or unknown repos
        await connectToRepository(owner, repo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze repository');
    } finally {
      setAnalyzingRepository(false);
    }
  };

  const connectToRepository = async (owner: string, repo: string) => {
    setConnectingToRepo(true);
    setError(null);

    try {
      // Clear all current data before switching repos
      if (onClearAllData) {
        console.log('[GitHub] Switching repos - clearing all data');
        onClearAllData();
      }

      const config: GitHubConfig = { token, owner, repo };
      await githubSync.connect(config);
      
      // Skip migration complexity - just connect to new repo
      setStep('connected');
      onConnectionChange(true);
      
      // Trigger file reload to load files from the newly selected repository
      if (onReloadFiles) {
        console.log('[GitHub] Triggering file reload after repository connection');
        onReloadFiles();
      }
      
      // Reset warning dialog state
      setShowWarningDialog(false);
      setPendingRepository(null);
      setRepositoryAnalysis(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to repository');
    } finally {
      setConnectingToRepo(false);
    }
  };

  const handleCreateRepository = async (name: string) => {
    try {
      const newRepo = await githubSync.createRepository(token, name);
      console.log('[GitHub] Created new repository, connecting and loading files');
      // Automatically select the newly created repository
      await handleRepositorySelect(newRepo.owner.login, newRepo.name);
    } catch (err) {
      throw err; // Let RepositoryPicker handle the error
    }
  };

  // Warning dialog handlers
  const handleWarningContinue = async () => {
    if (pendingRepository) {
      await connectToRepository(pendingRepository.owner, pendingRepository.repo);
    }
  };

  const handleWarningCreateNew = () => {
    setShowWarningDialog(false);
    setPendingRepository(null);
    setRepositoryAnalysis(null);
    // Let the user create a new repository in the picker
  };

  const handleWarningCancel = () => {
    setShowWarningDialog(false);
    setPendingRepository(null);
    setRepositoryAnalysis(null);
  };

  const handleDisconnect = async () => {
    console.log('[GitHub] Full disconnect - clearing everything including token');
    githubSync.fullDisconnect(); // Clear everything including token
    
    // Clear all data and reset to initial state
    if (onClearAllData) {
      await onClearAllData();
    }
    
    // Close sidebar to return to main welcome UI
    if (onCloseSidebar) {
      console.log('[GitHub] Closing sidebar after disconnect');
      onCloseSidebar();
    }
    
    // Reset component state completely
    setStep('disconnected');
    setToken(''); // Clear token from component state
    setError(null);
    onConnectionChange(false);
  };

  const handleSwitchRepository = () => {
    // When switching repos, we need to ensure we have the token
    const currentConfig = githubSync.getCurrentRepository();
    if (currentConfig?.token) {
      console.log('[GitHub] Switching repos - using token from current connection');
      setToken(currentConfig.token);
    } else {
      // Fallback to stored token
      const storedToken = githubSync.getStoredToken();
      if (storedToken) {
        console.log('[GitHub] Switching repos - using stored token');
        setToken(storedToken);
      }
    }
    setStep('repository');
  };

  const handleBackToToken = () => {
    setStep('token');
    setError(null);
  };


  if (step === 'connected') {
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
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
          
          {currentRepo && (
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--zen-bg-secondary)',
                borderColor: 'var(--zen-border)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div 
                    className="font-medium text-sm"
                    style={{ color: 'var(--zen-text-primary)' }}
                  >
                    {currentRepo.owner}/{currentRepo.repo}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: 'var(--zen-text-muted)' }}
                  >
                    Active repository
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwitchRepository}
                  style={{ color: 'var(--zen-text-secondary)' }}
                >
                  Switch
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Repository Warning Dialog */}
        {showWarningDialog && pendingRepository && repositoryAnalysis && (
          <RepositoryWarningDialog
            repositoryName={`${pendingRepository.owner}/${pendingRepository.repo}`}
            analysis={repositoryAnalysis}
            onContinue={handleWarningContinue}
            onCreateNew={handleWarningCreateNew}
            onCancel={handleWarningCancel}
            isLoading={connectingToRepo}
          />
        )}
      </>
    );
  }

  if (step === 'repository') {
    console.log('[GitHub] Repository step - token available:', !!token, 'token length:', token.length);
    
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 
              className="font-medium"
              style={{ color: 'var(--zen-text-primary)' }}
            >
              Select Repository
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToToken}
              style={{ color: 'var(--zen-text-secondary)' }}
            >
              Back
            </Button>
          </div>

          {error && (
            <Alert>
              <AlertDescription style={{ color: 'var(--zen-text-error)' }}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!token ? (
            <Alert>
              <AlertDescription style={{ color: 'var(--zen-text-error)' }}>
                No token available for repository listing. Please go back and enter your token.
              </AlertDescription>
            </Alert>
          ) : (
            <RepositoryPicker
              token={token}
              currentRepository={currentRepo}
              onRepositorySelect={handleRepositorySelect}
              onCreateRepository={handleCreateRepository}
            />
          )}

          {(connectingToRepo || analyzingRepository) && (
            <div 
              className="text-center text-sm"
              style={{ color: 'var(--zen-text-muted)' }}
            >
              {analyzingRepository ? 'Analyzing repository...' : 'Connecting to repository...'}
            </div>
          )}
        </div>

        {/* Repository Warning Dialog */}
        {showWarningDialog && pendingRepository && repositoryAnalysis && (
          <RepositoryWarningDialog
            repositoryName={`${pendingRepository.owner}/${pendingRepository.repo}`}
            analysis={repositoryAnalysis}
            onContinue={handleWarningContinue}
            onCreateNew={handleWarningCreateNew}
            onCancel={handleWarningCancel}
            isLoading={connectingToRepo}
          />
        )}
      </>
    );
  }

  if (step === 'token') {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 
              className="font-medium"
              style={{ color: 'var(--zen-text-primary)' }}
            >
              Connect to GitHub
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('disconnected')}
              style={{ color: 'var(--zen-text-secondary)' }}
            >
              Cancel
            </Button>
          </div>

          <div 
            className="text-sm"
            style={{ color: 'var(--zen-text-secondary)' }}
          >
            Your journal entries will be backed up to a GitHub repository as markdown files.
          </div>

          {error && (
            <Alert>
              <AlertDescription style={{ color: 'var(--zen-text-error)' }}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="token" style={{ color: 'var(--zen-text-secondary)' }}>
              Personal Access Token
            </Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTokenSubmit()}
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
            <div className="text-xs mt-1" style={{ color: 'var(--zen-text-muted)' }}>
              Token needs 'repo' scope to manage your repositories.
            </div>
          </div>

          <Button
            onClick={handleTokenSubmit}
            disabled={validatingToken || !token.trim()}
            className="w-full"
            style={{ 
              backgroundColor: 'var(--zen-accent)',
              color: 'white'
            }}
          >
            {validatingToken ? 'Validating...' : 'Continue'}
          </Button>
        </div>

        {/* Repository Warning Dialog */}
        {showWarningDialog && pendingRepository && repositoryAnalysis && (
          <RepositoryWarningDialog
            repositoryName={`${pendingRepository.owner}/${pendingRepository.repo}`}
            analysis={repositoryAnalysis}
            onContinue={handleWarningContinue}
            onCreateNew={handleWarningCreateNew}
            onCancel={handleWarningCancel}
            isLoading={connectingToRepo}
          />
        )}
      </>
    );
  }


  // step === 'disconnected'
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setStep('token')}
        className="transition-zen focus-ring"
        style={{ color: 'var(--zen-text-secondary)' }}
      >
        <Github className="w-4 h-4 mr-2" />
        Connect GitHub
      </Button>

      {/* Repository Warning Dialog */}
      {showWarningDialog && pendingRepository && repositoryAnalysis && (
        <RepositoryWarningDialog
          repositoryName={`${pendingRepository.owner}/${pendingRepository.repo}`}
          analysis={repositoryAnalysis}
          onContinue={handleWarningContinue}
          onCreateNew={handleWarningCreateNew}
          onCancel={handleWarningCancel}
          isLoading={connectingToRepo}
        />
      )}
    </>
  );
};