'use client'

import { useState, useEffect } from 'react'
import { Crown, Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { FREE_MESSAGE_LIMIT } from '@/lib/constants'

interface SubscriptionManagerProps {
  onSubscriptionUpdate?: (plan: string, status: string) => void
}

export function SubscriptionManager({ onSubscriptionUpdate }: SubscriptionManagerProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const { profile } = await response.json()
        setProfile(profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (priceId: string) => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isProUser = profile?.subscription_plan === 'pro' && profile?.subscription_status === 'active'
  const messageCount = profile?.message_count || 0
  const remainingMessages = Math.max(0, FREE_MESSAGE_LIMIT - messageCount)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription and usage limits
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isProUser ? (
                <Crown className="w-6 h-6 text-yellow-500" />
              ) : (
                <Zap className="w-6 h-6 text-blue-500" />
              )}
              <div>
                <CardTitle>
                  {isProUser ? 'Pro Plan' : 'Free Plan'}
                </CardTitle>
                <CardDescription>
                  {isProUser ? 'Unlimited messages and features' : `${remainingMessages} messages remaining`}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isProUser ? 'default' : 'secondary'}>
              {isProUser ? 'Active' : 'Free'}
            </Badge>
          </div>
        </CardHeader>

        {!isProUser && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Messages used</span>
                <span>{messageCount} / {FREE_MESSAGE_LIMIT}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (messageCount / FREE_MESSAGE_LIMIT) * 100)}%` }}
                />
              </div>
              {remainingMessages === 0 && (
                <p className="text-sm text-destructive">
                  You've reached your free message limit. Upgrade to continue chatting.
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Upgrade Options */}
      {!isProUser && (
        <div className="grid gap-4">
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <div>
                    <CardTitle>Pro Plan</CardTitle>
                    <CardDescription>Unlimited access to all features</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">$19</div>
                  <div className="text-sm text-muted-foreground">/month</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Unlimited messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Access to all 5 AI models</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Custom system prompts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Chat history & export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>

              <Button 
                onClick={() => handleUpgrade('price_pro_monthly')} // Replace with actual Stripe price ID
                disabled={upgrading}
                className="w-full"
                size="lg"
              >
                {upgrading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Upgrade to Pro'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pro User Management */}
      {isProUser && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              Your subscription is active and will renew automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Status</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Plan</span>
                <span>Pro Monthly</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Next billing</span>
                <span>Auto-renewal</span>
              </div>
              <Button variant="outline" className="w-full">
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
