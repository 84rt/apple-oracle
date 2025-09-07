import { BaseLLMProvider, LLMRequest, LLMResponse } from '../base';
import { LLMModel } from '@/types';

export class DeepSeekProvider extends BaseLLMProvider {
  model: LLMModel = 'deepseek';

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Use the correct model name based on provider configuration
      const modelName = this.model === 'deepseek' ? 'deepseek-chat' : 'deepseek-reasoner';
      
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: request.messages,
          temperature: request.temperature || 1.0, // Default is 1.0 according to docs
          max_tokens: request.max_tokens || 4096, // Default is 4096 according to docs
        }),
      })

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        model: this.model,
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
