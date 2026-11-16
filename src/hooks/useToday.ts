import { useEffect, useState } from 'react'
import { useProfile } from '../lib/api'
import { browserTz, todayIn } from '../lib/dates'

/** Data de hoje no fuso do usuário; vira sozinha à meia-noite. */
export function useToday() {
  const { data: profile } = useProfile()
  const tz = profile?.timezone || browserTz()
  const [today, setToday] = useState(() => todayIn(tz))

  useEffect(() => {
    const update = () => setToday(todayIn(tz))
    update()
    const t = window.setInterval(update, 15_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', update)
    }
  }, [tz])

  return today
}
