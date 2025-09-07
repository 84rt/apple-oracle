import { NextRequest, NextResponse } from 'next/server'
import { LLMManager } from '@/lib/llm/manager'
import { LLMModel } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { messages, models, apiKeys } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'At least one model must be selected' },
        { status: 400 }
      )
    }

    // Use platform API keys as fallback
    const allApiKeys = {
      'gpt-5': apiKeys?.['gpt-5'] || process.env.OPENAI_API_KEY,
      'claude-4': apiKeys?.['claude-4'] || process.env.ANTHROPIC_API_KEY,
      'gemini-2.5-pro': apiKeys?.['gemini-2.5-pro'] || process.env.GOOGLE_AI_API_KEY,
      'grok-4': apiKeys?.['grok-4'] || process.env.XAI_API_KEY,
      'deepseek': apiKeys?.['deepseek'] || process.env.DEEPSEEK_API_KEY,
    }

    const llmManager = new LLMManager(allApiKeys)
    const responses = await llmManager.generateResponses(models as LLMModel[], messages)

    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
