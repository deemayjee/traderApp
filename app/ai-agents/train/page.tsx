"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { agentSupabase } from '@/lib/services/agent-supabase'
import { useWalletAuth } from '@/components/auth/wallet-context'
import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'

export default function TrainingPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated } = useWalletAuth()

  useEffect(() => {
    const loadAgents = async () => {
      if (!user?.address) return
      
      try {
        const userAgents = await agentSupabase.getAllAgents(user.address)
        setAgents(userAgents)
      } catch (error) {
        console.error('Error loading agents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAgents()
  }, [user?.address])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to view and train your AI agents.
            </p>
            <Button asChild>
              <Link href="/auth/login">
                <Brain className="mr-2 h-4 w-4" />
                Connect Wallet
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Agents Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to create an AI agent before you can train it.
            </p>
            <Button asChild>
              <Link href="/ai-agents">
                <Brain className="mr-2 h-4 w-4" />
                Create Agent
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Select Agent to Train</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Type: {agent.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Performance: {agent.accuracy}% accuracy
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/ai-agents/${agent.id}/train`}>
                        <Brain className="mr-2 h-4 w-4" />
                        Train Agent
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 