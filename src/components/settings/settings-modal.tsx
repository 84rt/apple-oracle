'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiKeyManager } from '@/components/api-keys/api-key-manager'
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
      <DialogContent className="sm:max-w-[720px] md:max-w-[820px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Theme Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Appearance</h3>
            </div>
            <div className="max-w-xs">
              <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Currently using: {actualTheme} theme{theme === 'system' && ' (from system)'}
            </div>
          </div>

          {/* API Keys Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">API Keys</h3>
            </div>
            <ApiKeyManager />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
