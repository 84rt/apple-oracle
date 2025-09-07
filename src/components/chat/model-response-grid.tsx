'use client'

import { useState } from 'react'
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ModelResponse, LLMModel } from '@/types'
import { MODELS } from '@/lib/constants'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ModelResponseGridProps {
  responses: ModelResponse[]
  enabledModels: LLMModel[]
  className?: string
}

export function ModelResponseGrid({ responses, enabledModels, className }: ModelResponseGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Desktop: Grid layout
  const DesktopGrid = () => (
    <div className={cn(
      "hidden md:grid gap-4",
      enabledModels.length === 1 && "grid-cols-1",
      enabledModels.length === 2 && "grid-cols-2",
      enabledModels.length === 3 && "grid-cols-3",
      enabledModels.length === 4 && "grid-cols-2 lg:grid-cols-4",
      enabledModels.length === 5 && "grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    )}>
      {enabledModels.map(model => {
        const response = responses.find(r => r.model === model)
        const config = MODELS[model]
        
        return (
          <ModelResponseCard
            key={model}
            model={model}
            config={config}
            response={response}
            onCopy={copyToClipboard}
            copiedId={copiedId}
          />
        )
      })}
    </div>
  )

  // Mobile: Swipeable cards
  const MobileCards = () => {
    const [currentIndex, setCurrentIndex] = useState(0)
    
    return (
      <div className="md:hidden">
        {/* Card indicators */}
        <div className="flex justify-center gap-1 mb-4">
          {enabledModels.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Current card */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {enabledModels.map(model => {
              const response = responses.find(r => r.model === model)
              const config = MODELS[model]
              
              return (
                <div key={model} className="w-full flex-shrink-0 px-1">
                  <ModelResponseCard
                    model={model}
                    config={config}
                    response={response}
                    onCopy={copyToClipboard}
                    copiedId={copiedId}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {currentIndex + 1} of {enabledModels.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.min(enabledModels.length - 1, currentIndex + 1))}
            disabled={currentIndex === enabledModels.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <DesktopGrid />
      <MobileCards />
    </div>
  )
}

interface ModelResponseCardProps {
  model: LLMModel
  config: any
  response?: ModelResponse
  onCopy: (text: string, id: string) => void
  copiedId: string | null
}

function ModelResponseCard({ model, config, response, onCopy, copiedId }: ModelResponseCardProps) {
  const renderContent = () => {
    if (!response) {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Waiting for response...
        </div>
      )
    }

    if (response.status === 'pending') {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Generating response...
        </div>
      )
    }

    if (response.status === 'error') {
      return (
        <div className="flex items-center justify-center h-32 text-destructive">
          <AlertCircle className="w-6 h-6 mr-2" />
          <div className="text-center">
            <div className="font-medium">Error</div>
            <div className="text-sm">{response.error_message || 'Failed to generate response'}</div>
          </div>
        </div>
      )
    }

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {response.content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", config.color)} />
            <div>
              <div className="font-medium text-sm">{config.displayName}</div>
              <div className="text-xs text-muted-foreground">{config.provider}</div>
            </div>
          </div>
          
          {response?.status === 'completed' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopy(response.content, response.id)}
              className="h-8 w-8"
            >
              {copiedId === response.id ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pt-0">
        {renderContent()}
        
        {response?.status === 'completed' && response.token_count && (
          <div className="mt-4 pt-3 border-t border-border">
            <Badge variant="secondary" className="text-xs">
              {response.token_count} tokens
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
