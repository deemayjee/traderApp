import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { aiAgentService } from '@/lib/services/ai-agent-service'
import type { TrainingConfig } from '@/lib/services/ai-agent-service'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const { agentId, config } = await request.json() as {
      agentId: string
      config: TrainingConfig
    }

    if (!agentId || !config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify agent ownership
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', session.user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 404 }
      )
    }

    // Create training job
    const { data: job, error: jobError } = await supabase
      .from('agent_training_jobs')
      .insert({
        agent_id: agentId,
        status: 'pending',
        config,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Failed to create training job' },
        { status: 500 }
      )
    }

    // Start training in background
    aiAgentService.trainAgent(agent, config, job.id)
      .catch(error => {
        console.error('Training error:', error)
        // Update job status to failed
        supabase
          .from('agent_training_jobs')
          .update({
            status: 'failed',
            error: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)
      })

    return NextResponse.json({
      message: 'Training started',
      jobId: job.id
    })

  } catch (error) {
    console.error('Error in training endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const jobId = searchParams.get('jobId')

    if (!agentId && !jobId) {
      return NextResponse.json(
        { error: 'Missing agentId or jobId parameter' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('agent_training_jobs')
      .select(`
        *,
        agent:ai_agents(*)
      `)
      .eq('agent.user_id', session.user.id)

    if (jobId) {
      query = query.eq('id', jobId)
    } else if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    // Execute query
    const { data: jobs, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch training jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json(jobs)

  } catch (error) {
    console.error('Error in training endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 