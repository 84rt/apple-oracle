'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/theme-context'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme, actualTheme } = useTheme()

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light mode'
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark mode'
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Follow system preference'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Appearance</h3>
              <p className="text-xs text-muted-foreground">
                Choose how the app looks to you
              </p>
            </div>
            
            <div className="space-y-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isSelected = theme === option.value
                
                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? "default" : "ghost"}
                    onClick={() => setTheme(option.value)}
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>
            
            {/* Current theme indicator */}
            <div className="text-xs text-muted-foreground">
              Currently using: {actualTheme} theme
              {theme === 'system' && ' (from system)'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
