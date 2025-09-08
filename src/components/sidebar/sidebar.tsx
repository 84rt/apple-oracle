'use client';

import { useState } from 'react';
import { Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Chat } from '@/types';
import { ModelToggle } from './model-toggle';
import { ChatHistory } from './chat-history';
import { UserMenu } from './user-menu';
import { LLMModel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { MODELS } from '@/lib/constants';

interface SidebarProps {
  chats: Chat[];
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  enabledModels?: LLMModel[];
  onToggleModel?: (model: LLMModel, enabled: boolean) => void;
  className?: string;
  isCollapsed?: boolean;
}

export function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  enabledModels,
  onToggleModel,
  className,
  isCollapsed = false,
}: SidebarProps) {
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
      >
        {isMobileCollapsed ? (
          <Menu className="h-4 w-4" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-background border-r border-border transition-all duration-300 ease-in-out md:relative md:translate-x-0',
          'w-80', // Default width
          isMobileCollapsed && '-translate-x-full md:translate-x-0', // Mobile collapse
          isCollapsed && 'md:w-0 md:border-r-0', // Desktop collapse
          className
        )}
      >
        <div
          className={cn(
            'flex flex-col h-full transition-opacity duration-300',
            isCollapsed && 'md:opacity-0 md:pointer-events-none'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileCollapsed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Model Toggles */}
          <div className="py-12 px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Active Models</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {enabledModels?.length || 0} active
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => {
                    const allModels = Object.keys(MODELS) as LLMModel[];
                    const allSelected = (enabledModels?.length || 0) === allModels.length;
                    // Toggle only when change is needed to avoid duplicates
                    const enabledSet = new Set(enabledModels || []);
                    allModels.forEach((model) => {
                      const shouldEnable = !allSelected;
                      const isEnabled = enabledSet.has(model);
                      if (shouldEnable && !isEnabled) onToggleModel?.(model, true);
                      if (!shouldEnable && isEnabled) onToggleModel?.(model, false);
                    });
                  }}
                >
                  {(enabledModels?.length || 0) === Object.keys(MODELS).length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
            <ModelToggle
              enabledModels={enabledModels}
              onToggleModel={onToggleModel}
            />
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            <ChatHistory
              chats={chats}
              currentChatId={currentChatId}
              onSelectChat={onSelectChat}
            />
          </div>

          {/* User Menu */}
          <div className="p-4 border-t border-border">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {!isMobileCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileCollapsed(true)}
        />
      )}
    </>
  );
}
