'use client'

import { useState } from 'react'
import { AuthForm } from '@/components/auth/auth-form'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">LLM Compare</h1>
          <p className="text-muted-foreground">
            The professional platform for comparing AI model responses
          </p>
        </div>
        
        <AuthForm 
          mode={mode} 
          onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')} 
        />
      </div>
    </div>
  )
}
