import { useEffect, useState } from 'react'
import { pendingCount, subscribe } from '../lib/offline'

export function useSyncStatus() {
  const [pending, setPending] = useState(pendingCount())
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const unsub = subscribe(() => setPending(pendingCount()))
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      unsub()
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return { pending, online }
}
