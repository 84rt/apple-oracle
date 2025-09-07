import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LLMModel } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's API keys (encrypted values won't be returned)
    const { data: apiKeys, error } = await supabase
      .from('user_api_keys')
      .select('model, created_at')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('API keys fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { model, apiKey }: { model: LLMModel; apiKey: string } = await request.json()

    if (!model || !apiKey) {
      return NextResponse.json({ error: 'Model and API key are required' }, { status: 400 })
    }

    // Store encrypted API key using Supabase Vault
    const { error } = await supabase
      .from('user_api_keys')
      .upsert({
        user_id: user.id,
        model,
        encrypted_key: apiKey, // This will be encrypted by the database trigger
        created_at: new Date().toISOString()
      })

    if (error) {
      return NextResponse.json({ error: 'Failed to store API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API key storage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model') as LLMModel

    if (!model) {
      return NextResponse.json({ error: 'Model parameter is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('model', model)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API key deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
