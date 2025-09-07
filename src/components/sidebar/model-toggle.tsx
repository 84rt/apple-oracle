'use client'

import { useState } from 'react'
import { Check, Key, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MODELS } from '@/lib/constants'
import { LLMModel } from '@/types'

interface ModelToggleProps {
  enabledModels?: LLMModel[]
  onToggleModel?: (model: LLMModel, enabled: boolean) => void
  onAddApiKey?: (model: LLMModel) => void
}

function ModelToggle({ 
  enabledModels = ['gpt-5', 'grok-4', 'gemini-2.5-pro'], 
  onToggleModel,
  onAddApiKey 
}: ModelToggleProps) {
  const [localEnabledModels, setLocalEnabledModels] = useState<LLMModel[]>(enabledModels)

  const handleToggle = (model: LLMModel) => {
    const isEnabled = localEnabledModels.includes(model)
    const newEnabledModels = isEnabled
      ? localEnabledModels.filter(m => m !== model)
      : [...localEnabledModels, model]
    
    setLocalEnabledModels(newEnabledModels)
    onToggleModel?.(model, !isEnabled)
  }

  const handleAddKey = (model: LLMModel) => {
    onAddApiKey?.(model)
  }

  return (
    <div className="space-y-2">
      {Object.entries(MODELS).map(([modelKey, config]) => {
        const model = modelKey as LLMModel
        const isEnabled = localEnabledModels.includes(model)
        const hasApiKey = config.hasApiKey // This will be dynamic based on user's API keys
        
        return (
          <div
            key={model}
            className={cn(
              "flex items-center justify-between p-2 rounded-md border transition-colors",
              isEnabled ? "bg-accent" : "bg-background hover:bg-accent/50"
            )}
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleToggle(model)}
                className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                  isEnabled 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "border-input hover:border-primary"
                )}
              >
                {isEnabled && <Check className="w-3 h-3" />}
              </button>
              
              <div className="flex items-center space-x-2">
                <div className={cn("w-2 h-2 rounded-full", config.color)} />
                <div>
                  <div className="text-sm font-medium">{config.displayName}</div>
                  <div className="text-xs text-muted-foreground">{config.provider}</div>
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
                  onClick={() => handleAddKey(model)}
                  className="text-xs h-6 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Key
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { ModelToggle }
