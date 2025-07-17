import { useState, useEffect } from 'react';
import { GitHubRepository } from '../types/journal';
import { githubSync } from '../services/githubSync';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Search, Plus, GitBranch, Lock, Unlock, Check } from 'lucide-react';

interface RepositoryPickerProps {
  token: string;
  currentRepository?: { owner: string; repo: string } | null;
  onRepositorySelect: (owner: string, repo: string) => void;
  onCreateRepository: (name: string) => void;
}

export const RepositoryPicker = ({ 
  token, 
  currentRepository, 
  onRepositorySelect, 
  onCreateRepository 
}: RepositoryPickerProps) => {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, [token]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[RepositoryPicker] Loading repositories with token:', !!token, 'length:', token.length);
      const repos = await githubSync.listRepositories(token);
      console.log('[RepositoryPicker] Successfully loaded', repos.length, 'repositories');
      setRepositories(repos);
    } catch (err) {
      console.error('[RepositoryPicker] Failed to load repositories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepository = async () => {
    if (!newRepoName.trim()) return;
    
    try {
      setCreating(true);
      setError(null);
      await onCreateRepository(newRepoName.trim());
      setNewRepoName('');
      setShowCreateForm(false);
      // Note: Don't reload repositories here since the parent will handle repository selection
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create repository');
    } finally {
      setCreating(false);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div 
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--zen-accent)' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert>
          <AlertDescription style={{ color: 'var(--zen-text-error)' }}>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
               style={{ color: 'var(--zen-text-muted)' }} />
        <Input
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          style={{ 
            backgroundColor: 'var(--zen-bg-secondary)',
            borderColor: 'var(--zen-border)',
            color: 'var(--zen-text-primary)'
          }}
        />
      </div>

      {/* Create Repository Form */}
      {showCreateForm && (
        <div 
          className="p-4 rounded-lg border space-y-3"
          style={{ 
            backgroundColor: 'var(--zen-bg-secondary)',
            borderColor: 'var(--zen-border)'
          }}
        >
          <div className="flex items-center justify-between">
            <h4 
              className="font-medium"
              style={{ color: 'var(--zen-text-primary)' }}
            >
              Create New Repository
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(false)}
              style={{ color: 'var(--zen-text-secondary)' }}
            >
              Cancel
            </Button>
          </div>
          <Input
            placeholder="repository-name"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateRepository()}
            style={{ 
              backgroundColor: 'var(--zen-bg-primary)',
              borderColor: 'var(--zen-border)',
              color: 'var(--zen-text-primary)'
            }}
          />
          <Button
            onClick={handleCreateRepository}
            disabled={!newRepoName.trim() || creating}
            size="sm"
            style={{ 
              backgroundColor: 'var(--zen-accent)',
              color: 'white'
            }}
          >
            {creating ? 'Creating...' : 'Create Repository'}
          </Button>
        </div>
      )}

      {/* Create Repository Button */}
      {!showCreateForm && (
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setShowCreateForm(true)}
          style={{ 
            borderColor: 'var(--zen-border)',
            color: 'var(--zen-text-secondary)'
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Repository
        </Button>
      )}

      {/* Repository List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredRepositories.length === 0 ? (
          <div 
            className="text-center py-8 text-sm"
            style={{ color: 'var(--zen-text-muted)' }}
          >
            {searchTerm ? 'No repositories match your search.' : 'No repositories found.'}
          </div>
        ) : (
          filteredRepositories.map((repo) => {
            const isSelected = currentRepository && 
              repo.owner.login === currentRepository.owner && 
              repo.name === currentRepository.repo;

            return (
              <button
                key={repo.id}
                onClick={() => onRepositorySelect(repo.owner.login, repo.name)}
                className={`w-full text-left p-3 rounded-lg border transition-zen focus-ring ${
                  isSelected ? 'ring-2' : ''
                }`}
                style={{ 
                  backgroundColor: isSelected ? 'var(--zen-bg-secondary)' : 'var(--zen-bg-primary)',
                  borderColor: isSelected ? 'var(--zen-accent)' : 'var(--zen-border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <GitBranch className="w-4 h-4 flex-shrink-0" 
                              style={{ color: 'var(--zen-text-muted)' }} />
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-medium truncate"
                        style={{ color: 'var(--zen-text-primary)' }}
                      >
                        {repo.name}
                      </div>
                      <div 
                        className="text-sm truncate"
                        style={{ color: 'var(--zen-text-secondary)' }}
                      >
                        {repo.full_name}
                      </div>
                      {repo.description && (
                        <div 
                          className="text-xs truncate mt-1"
                          style={{ color: 'var(--zen-text-muted)' }}
                        >
                          {repo.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {repo.private ? (
                      <Lock className="w-4 h-4" style={{ color: 'var(--zen-text-muted)' }} />
                    ) : (
                      <Unlock className="w-4 h-4" style={{ color: 'var(--zen-text-muted)' }} />
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4" style={{ color: 'var(--zen-accent)' }} />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};