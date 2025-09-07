export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_status?: 'active' | 'inactive' | 'trialing';
  message_count: number;
  has_own_keys: boolean;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  mode: 'continuous' | 'single';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  model_responses?: ModelResponse[];
  created_at: string;
}

export interface ModelResponse {
  id: string;
  message_id: string;
  model: LLMModel;
  content: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  error_message?: string;
  token_count?: number;
  created_at: string;
}

export interface SystemPrompt {
  id: string;
  user_id: string | null;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
}

export interface UserAPIKey {
  id: string;
  user_id: string;
  model: LLMModel;
  is_active: boolean;
  created_at: string;
}

export type LLMModel =
  | 'gpt-5'
  | 'grok-4'
  | 'claude-4'
  | 'gemini-2.5-flash'
  | 'deepseek';

export interface ModelConfig {
  name: string;
  displayName: string;
  provider: string;
  color: string;
  enabled: boolean;
  hasApiKey: boolean;
}

export interface ChatMode {
  type: 'continuous' | 'single';
  label: string;
  description: string;
}

export interface APIKeyStatus {
  model: LLMModel;
  hasKey: boolean;
  isValid: boolean;
}
