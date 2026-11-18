import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChecks, useDayChecks, useRoutines, useRoutineStretches, useSaveSession, useSessions, useStretches, useToggleCheck, useToggleDay } from '../lib/api'
import { useToday } from '../hooks/useToday'
import { stretchesForRoutine, useActiveRoutine } from '../hooks/useActiveRoutine'
import { fmtLong } from '../lib/dates'
import { Empty, Icon, PageTitle, ProgressBar } from '../components/ui'

export default function Hoje() {
  const today = useToday()
  const stretches = useStretches()
  const routines = useRoutines()
  const links = useRoutineStretches()
  const checks = useChecks()
  const sessions = useSessions()
  const toggle = useToggleCheck()
  const dayChecks = useDayChecks()
  const toggleDay = useToggleDay()
  const saveSession = useSaveSession()
  const [routineId, setRoutineId] = useActiveRoutine()
  const [armed, setArmed] = useState(false)

  const list = useMemo(
    () => stretchesForRoutine(routineId, routines.data ?? [], links.data ?? [], stretches.data ?? []),
    [routineId, routines.data, links.data, stretches.data],
  )
  const done = useMemo(
    () => new Set((checks.data ?? []).filter((c) => c.date === today).map((c) => c.stretch_id)),
    [checks.data, today],
  )
  const doneCount = list.filter((s) => done.has(s.id)).length
  const dayMarked = (dayChecks.data ?? []).some((d) => d.date === today)
  const stretched = dayMarked || doneCount > 0
  const hasMinimum = (sessions.data ?? []).some((s) => s.date === today && s.is_minimum)

  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), 3500)
    return () => window.clearTimeout(t)
  }, [armed])

  function minimumDay() {
    if (!armed) return setArmed(true)
    saveSession({
      date: today,
      type: 'alongamento',
      duration_min: 5,
      lesson_id: null,
      feeling: null,
      pain_level: null,
      notes: null,
      is_minimum: true,
    })
    setArmed(false)
  }

  const loading = stretches.isLoading && !stretches.data

  return (
    <div>
      <PageTitle title={fmtLong(today)} sub="Abra, marque o que fez e feche." />

      {(routines.data?.length ?? 0) > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button className={`chip ${routineId === '' ? 'chip-on' : ''}`} onClick={() => setRoutineId('')}>Todos</button>
          {routines.data!.map((r) => (
            <button key={r.id} className={`chip ${routineId === r.id ? 'chip-on' : ''}`} onClick={() => setRoutineId(r.id)}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => toggleDay(today, !dayMarked)}
        aria-pressed={stretched}
        className={`mb-4 flex w-full items-center gap-3 rounded-md border p-4 text-left transition active:scale-[.99] ${
          stretched ? 'border-brand bg-brand/15' : 'border-line bg-subtle hover:border-muted'
        }`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${stretched ? 'border-brand bg-brand text-white' : 'border-muted'}`}>
          {stretched && (
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
          )}
        </span>
        <span>
          <span className="block text-base font-semibold">{stretched ? 'Me alonguei hoje' : 'Me alonguei hoje?'}</span>
          <span className="block text-xs text-muted">
            {stretched ? 'Dia contado na sua constância.' : 'Toque quando terminar. Não precisa marcar item por item.'}
          </span>
        </span>
      </button>

      <div className="card mb-4 p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold">Itens da rotina <span className="font-normal text-muted">(opcional)</span></span>
          <span className="font-mono text-sm text-muted">{doneCount} de {list.length} feitos</span>
        </div>
        <ProgressBar value={doneCount} max={list.length} />
        {list.length > 0 && doneCount === list.length && (
          <p className="mt-3 text-sm text-brand-fg">Rotina completa. Constância é isso — bom trabalho!</p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : list.length === 0 ? (
        <Empty>
          Nenhum alongamento por aqui ainda.
          <div className="mt-3">
            <Link to="/perfil" className="btn btn-primary">Criar alongamentos</Link>
          </div>
        </Empty>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {list.map((s) => {
            const on = done.has(s.id)
            return (
              <li key={s.id}>
                <button
                  onClick={() => toggle(s.id, today, !on)}
                  aria-pressed={on}
                  className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition active:bg-overlay"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      on ? 'border-brand bg-brand text-white' : 'border-muted'
                    }`}
                  >
                    {on && (
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${on ? 'text-muted line-through' : ''}`}>{s.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {[s.body_area, s.duration_seconds ? `${s.duration_seconds}s` : null, s.reps ? `${s.reps} reps` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link to="/hoje/timer" className={`btn col-span-2 ${list.length === 0 ? 'pointer-events-none opacity-50' : ''}`}>
          <Icon name="play" /> Iniciar timer
        </Link>
        <button className={`btn ${armed ? 'btn-primary' : ''}`} onClick={minimumDay} disabled={hasMinimum}>
          {hasMinimum ? 'Dia mínimo ✓' : armed ? 'Toque p/ confirmar' : 'Dia mínimo (5 min)'}
        </button>
        <Link to="/treinos/novo" className="btn"><Icon name="plus" /> Registrar treino</Link>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Cinco minutos contam. Nenhum dia em branco.</p>
    </div>
  )
}
