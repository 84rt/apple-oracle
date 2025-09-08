'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Settings2, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Message, LLMModel, SystemPrompt } from '@/types'
import { SystemPromptSelector } from './system-prompt-selector'
import { ChatModeToggle } from './chat-mode-toggle'
import { ModelResponseGrid } from './model-response-grid'

interface ChatInterfaceProps {
  messages: Message[]
  enabledModels: LLMModel[]
  currentMode: 'continuous' | 'single'
  systemPrompts: SystemPrompt[]
  selectedPromptId?: string
  onSendMessage: (content: string) => void
  onModeChange: (mode: 'continuous' | 'single') => void
  onPromptChange: (promptId: string) => void
  onNewChat: () => void
  isLoading?: boolean
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function ChatInterface({
  messages,
  enabledModels,
  currentMode,
  systemPrompts,
  selectedPromptId,
  onSendMessage,
  onModeChange,
  onPromptChange,
  onNewChat,
  isLoading = false,
  isSidebarCollapsed = false,
  onToggleSidebar
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button */}
            {onToggleSidebar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="hidden md:flex"
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            )}
            <SystemPromptSelector
              prompts={systemPrompts}
              selectedId={selectedPromptId}
              onSelect={onPromptChange}
            />
          </div>

          {/* Centered Chat Mode Toggle */}
          <div className="flex-1 flex items-center justify-center">
            <ChatModeToggle
              mode={currentMode}
              onModeChange={onModeChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {enabledModels.length} models active
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onNewChat}
              className="border-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div className="max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Compare</h3>
              <p className="text-muted-foreground mb-4">
                Send a message to see responses from {enabledModels.length} AI models side-by-side
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {enabledModels.map(model => (
                  <Badge key={model} variant="outline" className="text-xs">
                    {model}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <Card className="max-w-[80%] p-4 bg-primary text-primary-foreground">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </Card>
                </div>

                {/* Model Responses */}
                {message.model_responses && message.model_responses.length > 0 && (
                  <ModelResponseGrid 
                    responses={message.model_responses}
                    enabledModels={enabledModels}
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="min-h-[80px] max-h-[200px] resize-none pr-12"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-2 right-2"
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{input.length} characters</span>
          </div>
        </form>
      </div>
    </div>
  )
}
