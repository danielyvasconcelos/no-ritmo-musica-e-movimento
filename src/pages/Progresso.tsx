import { useMemo, useState } from 'react'
import { useDayChecks, useProfile, useSessions } from '../lib/api'
import { useToday } from '../hooks/useToday'
import { addDays, computeStreaks, daysInMonth, monthLabel, weekStart, weekdayMon, ymd } from '../lib/dates'
import { Icon, PageTitle, ProgressBar } from '../components/ui'

type Day = { minutes: number; sessions: number; stretched: boolean }
const LEVEL = ['bg-contrib-0', 'bg-contrib-1', 'bg-contrib-2', 'bg-contrib-3', 'bg-contrib-4']
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

export default function Progresso() {
  const today = useToday()
  const sessions = useSessions()
  const dayChecks = useDayChecks()
  const profile = useProfile()
  const goal = profile.data?.weekly_goal_days ?? 5

  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1]
  const [offset, setOffset] = useState(0)
  const monthIdx = ty * 12 + tm + offset
  const year = Math.floor(monthIdx / 12)
  const month = monthIdx % 12

  const days = useMemo(() => {
    const m = new Map<string, Day>()
    const get = (d: string): Day => m.get(d) ?? { minutes: 0, sessions: 0, stretched: false }
    for (const s of sessions.data ?? []) {
      const d = get(s.date)
      m.set(s.date, { ...d, minutes: d.minutes + s.duration_min, sessions: d.sessions + 1 })
    }
    for (const c of dayChecks.data ?? []) m.set(c.date, { ...get(c.date), stretched: true })
    return m
  }, [sessions.data, dayChecks.data])

  const active = useMemo(() => new Set(days.keys()), [days])
  const { current, best } = useMemo(() => computeStreaks(active, today), [active, today])

  // Semana (segunda a domingo)
  const ws = weekStart(today)
  let weekDays = 0
  let weekMinutes = 0
  let weekStretched = 0
  for (let i = 0; i < 7; i++) {
    const d = days.get(addDays(ws, i))
    if (d) {
      weekDays++
      weekMinutes += d.minutes
      if (d.stretched) weekStretched++
    }
  }
  const missing = Math.max(0, goal - weekDays)

  // Mês exibido
  const total = daysInMonth(year, month)
  const lead = weekdayMon(ymd(year, month, 1))
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => ymd(year, month, i + 1))]
  const elapsed = cells.filter((c): c is string => !!c && c <= today)
  const monthActive = elapsed.filter((d) => active.has(d)).length

  const level = (d?: Day) => {
    if (!d) return 0
    return Math.min(4, 1 + (d.sessions > 0 ? 1 : 0) + (d.stretched ? 1 : 0) + (d.minutes >= 30 ? 1 : 0))
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Constância" sub="A prova de que o aprendizado virou prática." />

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted"><Icon name="flame" size={14} className="text-attention" /> Sequência atual</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{current}<span className="ml-1 text-sm font-normal text-muted">{current === 1 ? 'dia' : 'dias'}</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Melhor sequência</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{best}<span className="ml-1 text-sm font-normal text-muted">{best === 1 ? 'dia' : 'dias'}</span></div>
        </div>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold">Esta semana</h2>
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span>{weekDays} de {goal} dias</span>
          <span className="text-muted">{missing === 0 ? 'Meta batida! 🎉' : `faltam ${missing}`}</span>
        </div>
        <ProgressBar value={weekDays} max={goal} />
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['Dias ativos', weekDays], ['Minutos', weekMinutes], ['Dias alongados', weekStretched]].map(([k, v]) => (
            <div key={k} className="rounded-md bg-inset py-2">
              <dd className="text-lg font-semibold tabular-nums">{v}</dd>
              <dt className="text-[11px] text-muted">{k}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button className="btn btn-ghost px-2" onClick={() => setOffset(offset - 1)} aria-label="Mês anterior"><Icon name="back" size={14} /></button>
          <h2 className="text-sm font-semibold first-letter:uppercase">{monthLabel(year, month)}</h2>
          <button className="btn btn-ghost px-2 disabled:opacity-30" onClick={() => setOffset(offset + 1)} disabled={offset >= 0} aria-label="Próximo mês">
            <Icon name="back" size={14} className="rotate-180" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAYS.map((w, i) => <div key={i} className="text-[11px] text-muted">{w}</div>)}
          {cells.map((d, i) =>
            d ? (
              <div
                key={d}
                title={d}
                className={`flex aspect-square items-center justify-center rounded-md border text-xs ${LEVEL[level(days.get(d))]} ${
                  d === today ? 'border-accent text-fg' : 'border-line/60 text-muted'
                } ${d > today ? 'opacity-40' : ''} ${active.has(d) ? 'text-white' : ''}`}
              >
                {Number(d.slice(8))}
              </div>
            ) : (
              <div key={`b${i}`} />
            ),
          )}
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          {offset === 0 ? 'Constante em' : 'Constância em'} {monthActive} de {elapsed.length} dias do mês.
        </p>
      </section>
      <p className="text-center text-xs text-muted">Conta como dia constante: ao menos 1 sessão registrada ou o check “Me alonguei hoje”.</p>
    </div>
  )
}
