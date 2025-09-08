'use client';

import { useState, useEffect } from 'react';
import { Check, Key, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MODELS } from '@/lib/constants';
import { LLMModel } from '@/types';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModelToggleProps {
  enabledModels?: LLMModel[];
  onToggleModel?: (model: LLMModel, enabled: boolean) => void;
  onAddApiKey?: (model: LLMModel) => void;
}

function ModelToggle({
  enabledModels = [
    'gpt-5',
    'claude-4',
    'gemini-2.5-flash',
    'grok-4',
    'deepseek',
  ],
  onToggleModel,
  onAddApiKey,
}: ModelToggleProps) {
  const [localEnabledModels, setLocalEnabledModels] =
    useState<LLMModel[]>(enabledModels);

  const [modelsWithKeys, setModelsWithKeys] = useState<Set<LLMModel>>(new Set());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocalEnabledModels(enabledModels);
  }, [enabledModels]);

  useEffect(() => {
    // Fetch which models already have stored API keys for this user
    const loadStoredKeys = async () => {
      try {
        const res = await fetch('/api/user/api-keys');
        if (res.ok) {
          const data = await res.json();
          const models: LLMModel[] = (data.apiKeys || []).map((k: { model: LLMModel }) => k.model);
          setModelsWithKeys(new Set(models));
        }
      } catch {
        // ignore
      }
    };
    loadStoredKeys();
  }, []);

  const handleToggle = (model: LLMModel) => {
    const isEnabled = localEnabledModels.includes(model);
    const newEnabledModels = isEnabled
      ? localEnabledModels.filter((m) => m !== model)
      : [...localEnabledModels, model];

    setLocalEnabledModels(newEnabledModels);
    onToggleModel?.(model, !isEnabled);
  };

  const handleAddKey = (model: LLMModel) => {
    // Prefer local small modal; fallback to external handler if provided
    if (onAddApiKey) {
      onAddApiKey(model);
      return;
    }
    setSelectedModel(model);
    setApiKeyInput('');
    setIsKeyModalOpen(true);
  };

  const saveApiKey = async () => {
    if (!selectedModel || !apiKeyInput.trim()) return;
    setIsSavingKey(true);
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, apiKey: apiKeyInput.trim() }),
      });
      if (res.ok) {
        setModelsWithKeys((prev) => new Set([...prev, selectedModel]));
        setIsKeyModalOpen(false);
      }
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="space-y-2">
      {Object.entries(MODELS).map(([modelKey, config]) => {
        const model = modelKey as LLMModel;
        const isEnabled = localEnabledModels.includes(model);
        const hasApiKey = modelsWithKeys.has(model);

        return (
          <div
            key={model}
            className={cn(
              'flex items-center justify-between p-2 rounded-md border transition-colors cursor-pointer',
              isEnabled ? 'bg-accent' : 'bg-background hover:bg-accent/50'
            )}
            role="button"
            tabIndex={0}
            onClick={() => handleToggle(model)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle(model);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(model); }}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shadow-sm',
                  isEnabled
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-input bg-background'
                )}
                aria-pressed={isEnabled}
                aria-label={isEnabled ? 'Disable model' : 'Enable model'}
              >
                {isEnabled && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center space-x-2">
                <div className={cn('w-2 h-2 rounded-full', config.color)} />
                <div>
                  <div className="text-sm font-medium">
                    {config.displayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {config.provider}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {hasApiKey ? (
                <Badge variant="secondary" className="text-xs">
                  <Key className="w-3 h-3 mr-1" />
                  API Key ✓
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleAddKey(model); }}
                  className="text-xs h-6 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Key
                </Button>
              )}
            </div>
          </div>
        );
      })}
      <AddKeyModal
        open={isKeyModalOpen}
        onOpenChange={setIsKeyModalOpen}
        model={selectedModel}
        providerLabel={selectedModel ? MODELS[selectedModel].provider : null}
        value={apiKeyInput}
        onChange={setApiKeyInput}
        onSave={saveApiKey}
        saving={isSavingKey}
      />
    </div>
  );
}

export { ModelToggle };

// Inline modal for adding a single API key
function AddKeyModal({
  open,
  onOpenChange,
  model,
  providerLabel,
  value,
  onChange,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  model: LLMModel | null;
  providerLabel: string | null;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add API key{providerLabel ? ` for ${providerLabel}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder={providerLabel ? `Enter your ${providerLabel} API key` : 'Enter API key'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
              disabled={!value.trim() || saving || !model}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
