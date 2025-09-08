import { NextRequest, NextResponse } from 'next/server';
import { LLMManager } from '@/lib/llm/manager';
import { LLMModel } from '@/types';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, models, apiKeys } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'At least one model must be selected' },
        { status: 400 }
      );
    }

    // Start with any keys provided by the client (not expected usually) or env fallbacks
    const baseApiKeys: Partial<Record<LLMModel, string>> = {
      'gpt-5': apiKeys?.['gpt-5'] || process.env.OPENAI_API_KEY,
      'claude-4': apiKeys?.['claude-4'] || process.env.ANTHROPIC_API_KEY,
      'gemini-2.5-flash': apiKeys?.['gemini-2.5-flash'] || process.env.GOOGLE_AI_API_KEY,
      'grok-4': apiKeys?.['grok-4'] || process.env.XAI_API_KEY,
      deepseek: apiKeys?.['deepseek'] || process.env.DEEPSEEK_API_KEY,
    };

    // Prefer user-stored API keys when available
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let mergedApiKeys: Partial<Record<LLMModel, string>> = { ...baseApiKeys };
    if (user) {
      try {
        const { data: rows } = await supabase
          .from('user_api_keys')
          .select('model, encrypted_key, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (rows && Array.isArray(rows)) {
          for (const row of rows as Array<{ model: LLMModel; encrypted_key: string; is_active: boolean }>) {
            // Defensive: only override if the stored value looks like a real key (not masked) and is non-empty
            const candidate = (row.encrypted_key || '').trim();
            const looksMasked = candidate.includes('****');
            const looksValidFormat = candidate.length >= 20; // rough sanity check

            if (candidate && !looksMasked && looksValidFormat) {
              mergedApiKeys[row.model] = candidate;
            }
          }
        }
      } catch (e) {
        // If fetching user keys fails, we silently fall back to env/client-provided keys
        console.warn('Failed to load user API keys, falling back to env keys');
      }
    }

    // Final sanity: trim keys and avoid obviously invalid placeholders
    for (const key of Object.keys(mergedApiKeys) as LLMModel[]) {
      const value = mergedApiKeys[key];
      if (!value) continue;
      const trimmed = value.trim();
      if (!trimmed || trimmed.includes('****')) {
        delete mergedApiKeys[key];
      } else {
        mergedApiKeys[key] = trimmed;
      }
    }

    const llmManager = new LLMManager(mergedApiKeys);

    // Always handle non-streaming responses
    const responses = await llmManager.generateResponses(
      models as LLMModel[],
      messages
    );
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
