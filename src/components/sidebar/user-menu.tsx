'use client'

import { useState } from 'react'
import { User, Settings, LogOut, Key, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { SettingsModal } from '@/components/settings/settings-modal'

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start p-2"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium truncate">
              {user.email}
            </div>
            <div className="text-xs text-muted-foreground">
              Free Trial
            </div>
          </div>
        </div>
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute bottom-full left-0 mb-2 w-full z-20 p-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="w-full justify-start"
                size="sm"
              >
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="w-full justify-start"
                size="sm"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Subscription
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setIsOpen(false)
                  setIsSettingsOpen(true)
                }}
                className="w-full justify-start"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut()
                    setIsOpen(false)
                  }}
                  className="w-full justify-start text-destructive hover:text-destructive"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
      
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </div>
  )
}
