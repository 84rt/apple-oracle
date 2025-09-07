'use client'

import { RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ChatModeToggleProps {
  mode: 'continuous' | 'single'
  onModeChange: (mode: 'continuous' | 'single') => void
}

export function ChatModeToggle({ mode, onModeChange }: ChatModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
      <Button
        variant={mode === 'continuous' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('continuous')}
        className={cn(
          "h-8 px-3 text-xs",
          mode === 'continuous' && "shadow-sm"
        )}
      >
        <RotateCcw className="w-3 h-3 mr-1" />
        Continuous
      </Button>
      
      <Button
        variant={mode === 'single' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('single')}
        className={cn(
          "h-8 px-3 text-xs",
          mode === 'single' && "shadow-sm"
        )}
      >
        <Zap className="w-3 h-3 mr-1" />
        Single Q
      </Button>
    </div>
  )
}
