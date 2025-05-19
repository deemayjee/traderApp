import { WebSocketServer } from 'ws'
import { Server } from 'http'
import { verifyAuth } from '@/lib/auth'

interface TrainingClient {
  ws: WebSocket
  jobId: string
  userId: string
}

export class TrainingWebSocketServer {
  private wss: WebSocketServer
  private clients: Map<string, TrainingClient> = new Map()

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server })

    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract job ID from URL
        const url = new URL(req.url || '', `http://${req.headers.host}`)
        const jobId = url.pathname.split('/').pop()
        
        if (!jobId) {
          ws.close(1008, 'Missing job ID')
          return
        }

        // Verify authentication
        const token = req.headers['sec-websocket-protocol']?.split(',')[0]
        if (!token) {
          ws.close(1008, 'Missing authentication token')
          return
        }

        const userId = await verifyAuth(token)
        if (!userId) {
          ws.close(1008, 'Invalid authentication token')
          return
        }

        // Store client
        this.clients.set(jobId, { ws, jobId, userId })

        // Handle client disconnect
        ws.on('close', () => {
          this.clients.delete(jobId)
        })

        // Handle errors
        ws.on('error', (error) => {
          console.error(`WebSocket error for job ${jobId}:`, error)
          this.clients.delete(jobId)
        })

      } catch (error) {
        console.error('Error in WebSocket connection:', error)
        ws.close(1011, 'Internal server error')
      }
    })
  }

  // Send metrics update to specific client
  sendMetrics(jobId: string, metrics: any): void {
    const client = this.clients.get(jobId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'metrics',
        metrics
      }))
    }
  }

  // Send error message to specific client
  sendError(jobId: string, message: string): void {
    const client = this.clients.get(jobId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'error',
        message
      }))
    }
  }

  // Send completion message to specific client
  sendComplete(jobId: string): void {
    const client = this.clients.get(jobId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'complete'
      }))
    }
  }

  // Broadcast message to all clients for a specific job
  broadcast(jobId: string, message: any): void {
    const client = this.clients.get(jobId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  }

  // Close connection for a specific job
  closeConnection(jobId: string): void {
    const client = this.clients.get(jobId)
    if (client) {
      client.ws.close()
      this.clients.delete(jobId)
    }
  }

  // Close all connections
  close(): void {
    this.wss.close()
    this.clients.clear()
  }
} 