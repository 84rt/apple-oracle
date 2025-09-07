import { LLMModel, ModelConfig } from '@/types'

export const MODELS: Record<LLMModel, ModelConfig> = {
  'gpt-5': {
    name: 'gpt-5',
    displayName: 'GPT-5',
    provider: 'OpenAI',
    color: 'bg-green-500',
    enabled: true,
    hasApiKey: false
  },
  'grok-4': {
    name: 'grok-4',
    displayName: 'Grok-4',
    provider: 'xAI',
    color: 'bg-blue-500',
    enabled: true,
    hasApiKey: false
  },
  'claude-4': {
    name: 'claude-4',
    displayName: 'Claude 4',
    provider: 'Anthropic',
    color: 'bg-orange-500',
    enabled: true,
    hasApiKey: false
  },
  'gemini-2.5-pro': {
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'Google',
    color: 'bg-purple-500',
    enabled: true,
    hasApiKey: false
  },
  'deepseek': {
    name: 'deepseek',
    displayName: 'DeepSeek',
    provider: 'DeepSeek',
    color: 'bg-red-500',
    enabled: true,
    hasApiKey: false
  }
}

export const DEFAULT_SYSTEM_PROMPTS = [
  {
    id: 'default-professional',
    name: 'Professional Assistant',
    content: 'You are a helpful, professional AI assistant. Provide clear, accurate, and well-structured responses.',
    user_id: null,
    is_default: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'default-creative',
    name: 'Creative Writer',
    content: 'You are a creative writing assistant. Help with storytelling, creative projects, and imaginative content with flair and originality.',
    user_id: null,
    is_default: true,
    created_at: new Date().toISOString()
  }
]

export const CHAT_MODES = [
  {
    type: 'continuous' as const,
    label: 'Continuous',
    description: 'Full conversation history sent with each request'
  },
  {
    type: 'single' as const,
    label: 'Single Q',
    description: 'Each message treated independently'
  }
]

export const FREE_MESSAGE_LIMIT = 3
export const API_TIMEOUT = 30000 // 30 seconds
