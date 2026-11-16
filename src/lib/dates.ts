const pad = (n: number) => String(n).padStart(2, '0')

export const browserTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'

/** "Hoje" (YYYY-MM-DD) no fuso do usuário. */
export function todayIn(tz: string): string {
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
  try {
    return new Intl.DateTimeFormat('en-CA', { ...opts, timeZone: tz }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA', opts).format(new Date())
  }
}

const toUTC = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export const addDays = (s: string, n: number) => fromUTC(toUTC(s) + n * 86_400_000)
/** 0 = segunda … 6 = domingo */
export const weekdayMon = (s: string) => (new Date(toUTC(s)).getUTCDay() + 6) % 7
export const weekStart = (s: string) => addDays(s, -weekdayMon(s))
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
export const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

export const fmtLong = (s: string) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(toUTC(s)))

export const fmtDay = (s: string) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(toUTC(s)))

export const monthLabel = (y: number, m: number) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m, 1)))

/** Sequência atual (até hoje; se hoje ainda está em branco, conta a partir de ontem) e melhor sequência. */
export function computeStreaks(active: Set<string>, today: string) {
  let current = 0
  let d = active.has(today) ? today : addDays(today, -1)
  while (active.has(d)) {
    current++
    d = addDays(d, -1)
  }
  const sorted = [...active].sort()
  let best = 0
  let run = 0
  let prev = ''
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1
    if (run > best) best = run
    prev = day
  }
  return { current, best: Math.max(best, current) }
}

export function fmtClock(total: number) {
  const m = Math.floor(total / 60)
  const s = Math.max(0, total % 60)
  return `${m}:${pad(s)}`
}

/** "3:40" ou "1:02:03" ou "220" → segundos */
export function parseClock(v: string): number | null {
  const parts = v.trim().split(':').map((p) => Number(p))
  if (!parts.length || parts.some((p) => Number.isNaN(p) || p < 0)) return null
  return parts.reduce((acc, p) => acc * 60 + p, 0)
}
