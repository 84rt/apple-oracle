'use client'

import { MessageSquare, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Chat } from '@/types'
import { formatDate } from '@/lib/utils'
import { useState, useMemo } from 'react'

interface ChatHistoryProps {
  chats: Chat[]
  currentChatId?: string
  onSelectChat: (chatId: string) => void
}

export function ChatHistory({ chats, currentChatId, onSelectChat }: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats
    return chats.filter(chat => 
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [chats, searchQuery])

  const groupedChats = useMemo(() => {
    const groups: Record<string, Chat[]> = {}
    
    filteredChats.forEach(chat => {
      const dateGroup = formatDate(chat.updated_at)
      if (!groups[dateGroup]) {
        groups[dateGroup] = []
      }
      groups[dateGroup].push(chat)
    })

    // Sort chats within each group by updated_at (newest first)
    Object.keys(groups).forEach(group => {
      groups[group].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    })

    return groups
  }, [filteredChats])

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older']

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs">Start a new chat to begin</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-8 text-sm"
        />
      </div>

      {/* Chat Groups */}
      <div className="space-y-4">
        {groupOrder.map(groupName => {
          const groupChats = groupedChats[groupName]
          if (!groupChats || groupChats.length === 0) return null

          return (
            <div key={groupName}>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                {groupName}
              </h4>
              <div className="space-y-1">
                {groupChats.map(chat => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "w-full justify-start h-auto p-2 text-left",
                      currentChatId === chat.id && "bg-accent"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {chat.title}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className="text-xs ml-2 flex-shrink-0"
                        >
                          {chat.mode === 'continuous' ? '🔄' : '⚡'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {filteredChats.length === 0 && searchQuery && (
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">No conversations found</p>
          <p className="text-xs">Try a different search term</p>
        </div>
      )}
    </div>
  )
}
