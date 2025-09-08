'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Chat, Message, SystemPrompt, LLMModel, ModelResponse } from '@/types';
import { generateChatTitle } from '@/lib/utils';
import { DEFAULT_SYSTEM_PROMPTS, MODELS } from '@/lib/constants';

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [enabledModels, setEnabledModels] = useState<LLMModel[]>([
    'gpt-5',
    'claude-4',
    'gemini-2.5-flash',
    'grok-4',
    'deepseek',
  ]);
  const [currentMode, setCurrentMode] = useState<'continuous' | 'single'>(
    'continuous'
  );
  const [systemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] =
    useState<string>('apple-oracle');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Add refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Load enabled models from localStorage on mount (and sanitize)
  useEffect(() => {
    const savedModels = localStorage.getItem('enabledModels');
    if (!savedModels) return;

    try {
      const parsed = JSON.parse(savedModels) as string[];

      // Map legacy/unknown model names to current supported ones
      const legacyMap: Record<string, LLMModel> = {
        'gemini-2.5-pro': 'gemini-2.5-flash',
      };

      const allowedModels = new Set(Object.keys(MODELS) as LLMModel[]);

      const sanitized = Array.from(
        new Set(
          parsed
            .map((m) => (legacyMap[m] ? legacyMap[m] : (m as LLMModel)))
            .filter((m): m is LLMModel => allowedModels.has(m as LLMModel))
        )
      );

      // If the sanitized list differs, persist the fix
      const original = JSON.stringify(parsed);
      const fixed = JSON.stringify(sanitized);
      if (original !== fixed) {
        localStorage.setItem('enabledModels', fixed);
      }

      if (sanitized.length > 0) {
        setEnabledModels(sanitized);
      }
    } catch (error) {
      console.error('Failed to parse saved models:', error);
    }
  }, []);

  // Save enabled models to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('enabledModels', JSON.stringify(enabledModels));
  }, [enabledModels]);

  const handleToggleModel = (model: LLMModel, enabled: boolean) => {
    setEnabledModels((prev) =>
      enabled ? [...prev, model] : prev.filter((m) => m !== model)
    );
  };

  const handleNewChat = useCallback(() => {
    // Cancel any ongoing streaming requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clean up stream reader
    if (streamReaderRef.current) {
      try {
        streamReaderRef.current.releaseLock();
      } catch (error) {
        // Reader might already be released
        console.warn('Reader already released:', error);
      }
      streamReaderRef.current = null;
    }
    
    // Reset loading state
    setIsLoading(false);
    
    const newChat: Chat = {
      id: Date.now().toString(),
      user_id: 'demo',
      title: 'New Chat',
      mode: currentMode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  }, [currentMode]);

  const handleSelectChat = useCallback((chatId: string) => {
    // Cancel any ongoing streaming requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clean up stream reader
    if (streamReaderRef.current) {
      try {
        streamReaderRef.current.releaseLock();
      } catch (error) {
        console.warn('Reader already released:', error);
      }
      streamReaderRef.current = null;
    }
    
    // Reset loading state
    setIsLoading(false);
    
    setCurrentChatId(chatId);
    // In a real app, this would load messages from the database
    setMessages([]);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    // Prevent multiple simultaneous requests
    if (isLoading) {
      return;
    }
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // If there's no active chat, initialize it BEFORE creating a new AbortController
    // to avoid aborting the controller we are about to use for this request.
    if (!currentChatId) {
      handleNewChat();
    }
    
    // Create new abort controller for this request (after potential new chat init)
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: Message = {
      id: Date.now().toString(),
      chat_id: currentChatId || Date.now().toString(),
      content,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare messages for API
      const systemPrompt = DEFAULT_SYSTEM_PROMPTS.find(
        (p) => p.id === selectedPromptId
      );
      const noThinkingDirective = 'Answer immediately with the shortest correct response. Do not include analysis, chain-of-thought, or step-by-step reasoning. Output only the final answer.';
      const apiMessages = [
        { role: 'system' as const, content: `${systemPrompt?.content || ''}\n\n${noThinkingDirective}`.trim() },
        ...(currentMode === 'continuous'
          ? messages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
          : []),
        { role: 'user' as const, content },
      ];

      // Treat all models as non-streaming
      const nonStreamingModels = enabledModels;
      const hasNonStreamingModels = nonStreamingModels.length > 0;
      const streamingModels: LLMModel[] = [];
      const nonStreamingOnly = enabledModels;

      // Initialize responses for ALL models with loading state
      const initialResponses: ModelResponse[] = enabledModels.map((model) => ({
        id: Date.now().toString() + Math.random() + model,
        message_id: userMessage.id,
        model,
        content: '',
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      }));

      // Update the user message with initial responses (shows loading spinners)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, model_responses: initialResponses }
            : msg
        )
      );

      // Handle non-streaming models (all models)
      if (hasNonStreamingModels) {
        const nonStreamingResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: apiMessages,
            models: nonStreamingOnly,
            apiKeys: {}, // User would provide their own API keys
            // stream flag is ignored by API now; provided for compatibility
            stream: false,
          }),
        });

        if (nonStreamingResponse.ok) {
          const { responses } = await nonStreamingResponse.json();
          
          // Update responses for non-streaming models
          const nonStreamingModelResponses: ModelResponse[] = responses.map((resp: { model: LLMModel; content: string; error?: string; usage?: { total_tokens: number } }) => ({
            id: Date.now().toString() + Math.random() + resp.model,
            message_id: userMessage.id,
            model: resp.model,
            content: resp.content,
            status: resp.error ? 'error' : 'completed',
            error_message: resp.error,
            token_count: resp.usage?.total_tokens,
            created_at: new Date().toISOString(),
          }));

          // Update the user message with non-streaming responses
          setMessages(prev => prev.map(msg => 
            msg.id === userMessage.id && msg.model_responses
              ? { 
                  ...msg, 
                  model_responses: msg.model_responses.map(resp => {
                    const newResp = nonStreamingModelResponses.find(nr => nr.model === resp.model);
                    return newResp || resp;
                  })
                }
              : msg
          ));
        }
      }

      // No streaming step; all models handled above

      // Update chat title if this is the first message
      if (messages.length === 0) {
        const newTitle = generateChatTitle(content, currentMode);
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  title: newTitle,
                  updated_at: new Date().toISOString(),
                }
              : chat
          )
        );
      }
    } catch (error) {
      // Don't log abort errors as they're expected
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      
      console.error('Error sending message:', error);
      // Handle error state - mark all responses as error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id && msg.model_responses
            ? {
                ...msg,
                model_responses: msg.model_responses.map((resp) => ({
                  ...resp,
                  status: 'error' as const,
                  error_message: 'Failed to get response',
                })),
              }
            : msg
        )
      );
    } finally {
      // Only reset loading if this is still the active request
      if (abortControllerRef.current === abortController) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [currentChatId, messages, selectedPromptId, currentMode, enabledModels, isLoading, handleNewChat]);

  const handleClearHistory = useCallback(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clean up stream reader
    if (streamReaderRef.current) {
      try {
        streamReaderRef.current.releaseLock();
      } catch (error) {
        console.warn('Reader cleanup error:', error);
      }
      streamReaderRef.current = null;
    }
    
    setIsLoading(false);
    setMessages([]);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clean up stream reader on unmount
      if (streamReaderRef.current) {
        try {
          streamReaderRef.current.releaseLock();
        } catch (error) {
          console.warn('Cleanup on unmount error:', error);
        }
      }
    };
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          enabledModels={enabledModels}
          onToggleModel={handleToggleModel}
          isCollapsed={isSidebarCollapsed}
          className="flex-shrink-0"
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
            onNewChat={handleNewChat}
            isLoading={isLoading}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
