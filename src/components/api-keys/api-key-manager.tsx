'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Key, Trash2, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { MODELS } from '@/lib/constants'
import { LLMModel } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface ApiKeyManagerProps {
  onApiKeyUpdate?: (model: LLMModel, hasKey: boolean) => void
}

export function ApiKeyManager({ onApiKeyUpdate }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<Record<LLMModel, string>>({} as Record<LLMModel, string>)
  const [storedKeys, setStoredKeys] = useState<LLMModel[]>([])
  const [showKeys, setShowKeys] = useState<Record<LLMModel, boolean>>({} as Record<LLMModel, boolean>)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<LLMModel | null>(null)
  const [providerEditing, setProviderEditing] = useState<Record<string, boolean>>({})
  const [providerInputs, setProviderInputs] = useState<Record<string, string>>({})
  const [providerSaving, setProviderSaving] = useState<Record<string, boolean>>({})
  const [providerError, setProviderError] = useState<Record<string, string | null>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchStoredKeys()
  }, [])

  const fetchStoredKeys = async () => {
    try {
      const response = await fetch('/api/user/api-keys')
      if (response.ok) {
        const { apiKeys } = await response.json()
        const models = apiKeys.map((key: any) => key.model)
        setStoredKeys(models)
      }
    } catch (error) {
      console.error('Failed to fetch stored keys:', error)
    }
  }

  const handleSaveKey = async (model: LLMModel) => {
    const key = apiKeys[model]
    if (!key?.trim()) return

    setSaving(model)
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, apiKey: key.trim() })
      })

      if (response.ok) {
        setStoredKeys(prev => [...prev.filter(k => k !== model), model])
        setApiKeys(prev => ({ ...prev, [model]: '' }))
        onApiKeyUpdate?.(model, true)
      } else {
        throw new Error('Failed to save API key')
      }
    } catch (error) {
      console.error('Error saving API key:', error)
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteKey = async (model: LLMModel) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/user/api-keys?model=${model}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setStoredKeys(prev => prev.filter(k => k !== model))
        onApiKeyUpdate?.(model, false)
      } else {
        throw new Error('Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleShowKey = (model: LLMModel) => {
    setShowKeys(prev => ({ ...prev, [model]: !prev[model] }))
  }

  // Provider-level helpers
  const getProviderGroups = () => {
    return Object.entries(MODELS).reduce((groups, [modelKey, config]) => {
      const provider = config.provider
      if (!groups[provider]) groups[provider] = [] as LLMModel[]
      groups[provider].push(modelKey as LLMModel)
      return groups
    }, {} as Record<string, LLMModel[]>)
  }

  const providerHasStoredKey = (provider: string) => {
    const groups = getProviderGroups()
    const models = groups[provider] || []
    return models.some(m => storedKeys.includes(m))
  }

  const startEditProvider = (provider: string) => {
    setProviderEditing(prev => ({ ...prev, [provider]: true }))
    setProviderInputs(prev => ({ ...prev, [provider]: '' }))
    setProviderError(prev => ({ ...prev, [provider]: null }))
  }

  const cancelEditProvider = (provider: string) => {
    setProviderEditing(prev => ({ ...prev, [provider]: false }))
    setProviderInputs(prev => ({ ...prev, [provider]: '' }))
    setProviderError(prev => ({ ...prev, [provider]: null }))
  }

  const validateProviderKey = (provider: string, key: string) => {
    if (!key || key.trim().length < 10) return 'Key looks too short'
    return null
  }

  const saveProviderKey = async (provider: string) => {
    const key = (providerInputs[provider] || '').trim()
    const error = validateProviderKey(provider, key)
    if (error) {
      setProviderError(prev => ({ ...prev, [provider]: error }))
      return
    }

    const groups = getProviderGroups()
    const models = groups[provider] || []
    setProviderSaving(prev => ({ ...prev, [provider]: true }))
    try {
      for (const model of models) {
        const response = await fetch('/api/user/api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, apiKey: key })
        })
        if (!response.ok) throw new Error('Failed to save one or more API keys')
      }
      // Refresh stored keys view
      setStoredKeys(prev => {
        const updated = new Set(prev)
        models.forEach(m => { updated.add(m) })
        return Array.from(updated)
      })
      cancelEditProvider(provider)
    } catch (e) {
      setProviderError(prev => ({ ...prev, [provider]: 'Failed to save API keys' }))
    } finally {
      setProviderSaving(prev => ({ ...prev, [provider]: false }))
    }
  }

  const deleteProviderKeys = async (provider: string) => {
    const groups = getProviderGroups()
    const models = groups[provider] || []
    setProviderSaving(prev => ({ ...prev, [provider]: true }))
    try {
      for (const model of models) {
        const response = await fetch(`/api/user/api-keys?model=${model}`, { method: 'DELETE' })
        if (!response.ok) throw new Error('Failed to delete one or more API keys')
      }
      setStoredKeys(prev => prev.filter(m => !models.includes(m)))
    } catch (e) {
      setProviderError(prev => ({ ...prev, [provider]: 'Failed to delete API keys' }))
    } finally {
      setProviderSaving(prev => ({ ...prev, [provider]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Keys</h2>
      </div>

      {/* Compact provider-based rows */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 px-1 text-xs text-muted-foreground">
          <div>Provider</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>
        {Object.entries(getProviderGroups()).map(([provider, models]) => {
          const isEditing = !!providerEditing[provider]
          const hasAnyKey = providerHasStoredKey(provider)
          const isBusy = !!providerSaving[provider]
          const error = providerError[provider]
          return (
            <div key={provider} className="grid grid-cols-3 items-center gap-2 px-1 py-2 rounded-md border">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{provider}</span>
              </div>
              <div className="text-sm">
                {hasAnyKey ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" /> Stored
                  </span>
                ) : (
                  <span className="text-muted-foreground">No key</span>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                {!isEditing ? (
                  <>
                    {!hasAnyKey && (
                      <Button variant="outline" size="sm" onClick={() => startEditProvider(provider)}>
                        Add
                      </Button>
                    )}
                    {hasAnyKey && (
                      <Button variant="ghost" size="sm" onClick={() => deleteProviderKeys(provider)} disabled={isBusy} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1 w-full justify-end">
                    <Input
                      placeholder={`Enter ${provider} key`}
                      value={providerInputs[provider] || ''}
                      onChange={(e) => setProviderInputs(prev => ({ ...prev, [provider]: e.target.value }))}
                      className="h-8 max-w-[240px]"
                    />
                    <Button size="sm" variant="ghost" onClick={() => cancelEditProvider(provider)} className="h-8 w-8 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="default" onClick={() => saveProviderKey(provider)} disabled={isBusy || !(providerInputs[provider] || '').trim()} className="h-8 px-3">
                      {isBusy ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
              {error && (
                <div className="col-span-3 text-xs text-destructive mt-1">{error}</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">🔒 Security Information</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• API keys are encrypted using Supabase Vault before storage</li>
          <li>• Keys are never transmitted in plain text after initial setup</li>
          <li>• Only you can access your encrypted API keys</li>
          <li>• You can delete stored keys at any time</li>
        </ul>
      </div>
    </div>
  )
}
