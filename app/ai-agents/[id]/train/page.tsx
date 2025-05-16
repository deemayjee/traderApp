import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TrainingConfigForm } from '@/components/ai-agents/training-config'
import { TrainingMonitor } from '@/components/ai-agents/training-monitor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TrainingConfig } from '@/lib/services/ai-agent-service'

interface TrainingPageProps {
  params: {
    id: string
  }
}

async function getAgent(id: string) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return null
  }

  const { data: agent } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  return agent
}

async function getLatestTrainingJob(agentId: string) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: job } = await supabase
    .from('agent_training_jobs')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return job
}

export default async function TrainingPage({ params }: TrainingPageProps) {
  const agent = await getAgent(params.id)
  if (!agent) {
    notFound()
  }

  const latestJob = await getLatestTrainingJob(params.id)
  const isTraining = latestJob?.status === 'training'

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Train Agent: {agent.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configure the training parameters and start training your agent to improve its trading performance.
          </p>
        </CardContent>
      </Card>

      {isTraining ? (
        <Suspense fallback={<div>Loading training monitor...</div>}>
          <TrainingMonitor
            jobId={latestJob.id}
            onComplete={() => {
              // Refresh the page when training completes
              window.location.reload()
            }}
          />
        </Suspense>
      ) : (
        <TrainingConfigForm
          onSubmit={async (config: TrainingConfig) => {
            'use server'
            
            const response = await fetch('/api/ai-agents/train', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                agentId: params.id,
                config
              })
            })

            if (!response.ok) {
              throw new Error('Failed to start training')
            }

            // Refresh the page to show the training monitor
            window.location.reload()
          }}
        />
      )}
    </div>
  )
} 