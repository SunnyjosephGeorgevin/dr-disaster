import { useEffect, useRef, useState } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/stream'
const RECONNECT_DELAY_MS = 2000

/**
 * Subscribes to the FastAPI /ws/stream endpoint and keeps the latest
 * dashboard state in React state. Reconnects automatically if the socket
 * drops — the connection to the backend is independent of the drone's
 * own connectivity state shown in the UI.
 */
export function useWebSocket() {
  const [state, setState] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const socketRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    function connect() {
      const ws = new WebSocket(WS_URL)
      socketRef.current = ws

      ws.onopen = () => {
        if (cancelled) return
        setSocketConnected(true)
      }

      ws.onmessage = (event) => {
        if (cancelled) return
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'state_update') setState(data)
        } catch (err) {
          console.error('Malformed state_update payload', err)
        }
      }

      ws.onclose = () => {
        if (cancelled) return
        setSocketConnected(false)
        timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
      socketRef.current?.close()
    }
  }, [])

  return { state, socketConnected }
}
