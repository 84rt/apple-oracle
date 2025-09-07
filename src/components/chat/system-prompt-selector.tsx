'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SystemPrompt } from '@/types'
import { DEFAULT_SYSTEM_PROMPTS } from '@/lib/constants'

interface SystemPromptSelectorProps {
  prompts: SystemPrompt[]
  selectedId?: string
  onSelect: (promptId: string) => void
  onAddCustom?: () => void
}

export function SystemPromptSelector({ 
  prompts, 
  selectedId, 
  onSelect, 
  onAddCustom 
}: SystemPromptSelectorProps) {
  const allPrompts = [...DEFAULT_SYSTEM_PROMPTS, ...prompts]
  const selectedPrompt = allPrompts.find(p => p.id === selectedId) || allPrompts[0]

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Select system prompt">
            {selectedPrompt?.name || 'Select system prompt'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-80 bg-background border border-border shadow-lg">
          {allPrompts.map((prompt: SystemPrompt) => (
            <SelectItem key={prompt.id} value={prompt.id}>
              <div className="w-full">
                <div className="font-medium text-sm">{prompt.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {prompt.content}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {onAddCustom && (
        <Button
          onClick={onAddCustom}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Custom
        </Button>
      )}
    </div>
  )
}
