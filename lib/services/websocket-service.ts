import { create } from 'zustand'

interface WebSocketState {
  socket: WebSocket | null
  isConnected: boolean
  lastPrice: Record<string, number>
  connect: () => void
  disconnect: () => void
  updatePrice: (symbol: string, price: number) => void
}

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws'

export const useWebSocket = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  lastPrice: {},

  connect: () => {
    const { socket } = get()
    if (socket?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(BINANCE_WS_URL)
    
    ws.onopen = () => {
      console.log('WebSocket Connected')
      set({ isConnected: true, socket: ws })
      
      // Subscribe to multiple symbols
      const symbols = ['btcusdt', 'ethusdt', 'solusdt']
      const subscribeMsg = {
        method: 'SUBSCRIBE',
        params: symbols.map(symbol => `${symbol}@trade`),
        id: 1
      }
      ws.send(JSON.stringify(subscribeMsg))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.e === 'trade') {
          const symbol = data.s.toUpperCase()
          const price = parseFloat(data.p)
          set((state) => ({
            lastPrice: {
              ...state.lastPrice,
              [symbol]: price
            }
          }))
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket Disconnected')
      set({ isConnected: false, socket: null })
      // Attempt to reconnect after 5 seconds
      setTimeout(() => get().connect(), 5000)
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ socket: null, isConnected: false })
    }
  },

  updatePrice: (symbol: string, price: number) => {
    set((state) => ({
      lastPrice: {
        ...state.lastPrice,
        [symbol]: price
      }
    }))
  }
})) 