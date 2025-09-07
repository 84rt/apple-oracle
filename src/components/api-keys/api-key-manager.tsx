'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Key, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Key Management</h2>
        <p className="text-muted-foreground">
          Securely store your LLM API keys. Keys are encrypted and stored safely in your account.
        </p>
      </div>

      <div className="grid gap-4">
        {Object.entries(MODELS).map(([modelKey, config]) => {
          const model = modelKey as LLMModel
          const hasStoredKey = storedKeys.includes(model)
          const currentKey = apiKeys[model] || ''
          const isShowingKey = showKeys[model]
          const isSaving = saving === model

          return (
            <Card key={model} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <div>
                      <CardTitle className="text-lg">{config.displayName}</CardTitle>
                      <CardDescription>{config.provider}</CardDescription>
                    </div>
                  </div>
                  {hasStoredKey && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      Stored
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {hasStoredKey ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">API key stored securely</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKey(model)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={isShowingKey ? 'text' : 'password'}
                        placeholder={`Enter your ${config.provider} API key`}
                        value={currentKey}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, [model]: e.target.value }))}
                        className="pr-20"
                      />
                      <div className="absolute right-1 top-1 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleShowKey(model)}
                          className="h-8 w-8 p-0"
                        >
                          {isShowingKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveKey(model)}
                          disabled={!currentKey.trim() || isSaving}
                          className="h-8 w-8 p-0"
                        >
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your API key from {config.provider}'s developer console
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
