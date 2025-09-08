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
    <div className="flex items-center gap-1 p-1 bg-muted rounded-full border border-border">
      <Button
        variant={mode === 'continuous' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('continuous')}
        className={cn(
          "h-8 px-3 text-xs rounded-full",
          mode === 'continuous' && "shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <RotateCcw className={cn("w-3 h-3 mr-1", mode === 'continuous' ? "opacity-100" : "opacity-60")} />
        <span className={cn(mode === 'continuous' ? "font-semibold" : "text-muted-foreground")}>Continuous</span>
      </Button>
      
      <Button
        variant={mode === 'single' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('single')}
        className={cn(
          "h-8 px-3 text-xs rounded-full",
          mode === 'single' && "shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <Zap className={cn("w-3 h-3 mr-1", mode === 'single' ? "opacity-100" : "opacity-60")} />
        <span className={cn(mode === 'single' ? "font-semibold" : "text-muted-foreground")}>Single Q</span>
      </Button>
    </div>
  )
}
