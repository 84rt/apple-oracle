'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Chat, Message, SystemPrompt, LLMModel, ModelResponse } from '@/types'
import { DEFAULT_SYSTEM_PROMPTS } from '@/lib/constants'
import { generateChatTitle } from '@/lib/utils'

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>()
  const [messages, setMessages] = useState<Message[]>([])
  const [enabledModels, setEnabledModels] = useState<LLMModel[]>(['gpt-5', 'grok-4', 'gemini-2.5-pro'])
  const [currentMode, setCurrentMode] = useState<'continuous' | 'single'>('continuous')
  const [systemPrompts] = useState<SystemPrompt[]>([
    {
      id: '1',
      user_id: 'demo',
      name: DEFAULT_SYSTEM_PROMPTS[0].name,
      content: DEFAULT_SYSTEM_PROMPTS[0].content,
      is_default: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'demo',
      name: DEFAULT_SYSTEM_PROMPTS[1].name,
      content: DEFAULT_SYSTEM_PROMPTS[1].content,
      is_default: true,
      created_at: new Date().toISOString()
    }
  ])
  const [selectedPromptId, setSelectedPromptId] = useState<string>('1')
  const [isLoading, setIsLoading] = useState(false)

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      user_id: 'demo',
      title: 'New Chat',
      mode: currentMode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    setMessages([])
  }

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
    // In a real app, this would load messages from the database
    setMessages([])
  }

  const handleSendMessage = async (content: string) => {
    if (!currentChatId) {
      handleNewChat()
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      chat_id: currentChatId || Date.now().toString(),
      content,
      role: 'user',
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Prepare messages for API
      const systemPrompt = systemPrompts.find(p => p.id === selectedPromptId)
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt?.content || '' },
        ...(currentMode === 'continuous' ? messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })) : []),
        { role: 'user' as const, content }
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          models: enabledModels,
          apiKeys: {} // User would provide their own API keys
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get responses')
      }

      const { responses } = await response.json()
      
      // Create model responses
      const modelResponses: ModelResponse[] = responses.map((resp: { model: LLMModel; content: string; error?: string; usage?: { total_tokens: number } }) => ({
        id: Date.now().toString() + Math.random(),
        message_id: userMessage.id,
        model: resp.model,
        content: resp.content,
        status: resp.error ? 'error' : 'completed',
        error_message: resp.error,
        token_count: resp.usage?.total_tokens,
        created_at: new Date().toISOString()
      }))

      // Update the user message with responses
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, model_responses: modelResponses }
          : msg
      ))

      // Update chat title if this is the first message
      if (messages.length === 0) {
        const newTitle = generateChatTitle(content, currentMode)
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, title: newTitle, updated_at: new Date().toISOString() }
            : chat
        ))
      }

    } catch (error) {
      console.error('Error sending message:', error)
      // Handle error state
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = () => {
    setMessages([])
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          className="w-80 flex-shrink-0"
        />
        
        <div className="flex-1 flex flex-col">
          <ChatInterface
            messages={messages}
            enabledModels={enabledModels}
            currentMode={currentMode}
            systemPrompts={systemPrompts}
            selectedPromptId={selectedPromptId}
            onSendMessage={handleSendMessage}
            onModeChange={setCurrentMode}
            onPromptChange={setSelectedPromptId}
            onClearHistory={handleClearHistory}
            isLoading={isLoading}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}
