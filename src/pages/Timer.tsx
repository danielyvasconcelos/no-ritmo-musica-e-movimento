import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChecks, useRoutines, useRoutineStretches, useStretches, useToggleCheck } from '../lib/api'
import { useToday } from '../hooks/useToday'
import { stretchesForRoutine, useActiveRoutine } from '../hooks/useActiveRoutine'
import { fmtClock } from '../lib/dates'
import { Icon } from '../components/ui'

const DEFAULT_SECONDS = 30

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.15
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    /* sem áudio */
  }
  navigator.vibrate?.([200, 100, 200])
}

export default function Timer() {
  const today = useToday()
  const stretches = useStretches()
  const routines = useRoutines()
  const links = useRoutineStretches()
  const checks = useChecks()
  const toggle = useToggleCheck()
  const [routineId] = useActiveRoutine()

  const list = useMemo(
    () => stretchesForRoutine(routineId, routines.data ?? [], links.data ?? [], stretches.data ?? []),
    [routineId, routines.data, links.data, stretches.data],
  )
  const doneSet = useMemo(
    () => new Set((checks.data ?? []).filter((c) => c.date === today).map((c) => c.stretch_id)),
    [checks.data, today],
  )

  const [idx, setIdx] = useState(0)
  const [perSide, setPerSide] = useState(() => localStorage.getItem('nr-per-side') === '1')
  const [side, setSide] = useState<1 | 2>(1)
  const current = list[idx]
  const total = current?.duration_seconds ?? DEFAULT_SECONDS
  const [remaining, setRemaining] = useState(total)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [notice, setNotice] = useState('')
  const wake = useRef<WakeLockSentinel | null>(null)
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem('nr-auto-next') !== '0')
  const [gap, setGap] = useState<number | null>(null)
  const autoStart = useRef(false)
  const isLast = idx >= list.length - 1

  // Reinicia ao trocar de exercício.
  useEffect(() => {
    setRemaining(current?.duration_seconds ?? DEFAULT_SECONDS)
    setSide(1)
    setFinished(false)
    setRunning(autoStart.current) // segue direto para o próximo, sem clicar em "Começar"
    autoStart.current = false
    setGap(null)
    setNotice('')
  }, [current?.id, current?.duration_seconds])

  // Pausa curta entre exercícios; depois começa o próximo sozinho.
  useEffect(() => {
    if (gap === null) return
    if (gap <= 0) {
      autoStart.current = true
      setGap(null)
      setIdx((i) => i + 1)
      return
    }
    const t = window.setTimeout(() => setGap((g) => (g === null ? null : g - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [gap])

  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => window.clearInterval(t)
  }, [running])

  useEffect(() => {
    if (!running || remaining > 0 || !current) return
    beep()
    if (perSide && side === 1) {
      setSide(2)
      setRemaining(total)
      setNotice('Troque de lado!')
    } else {
      setRunning(false)
      setFinished(true)
      setNotice('')
      if (!doneSet.has(current.id)) toggle(current.id, today, true)
      if (autoNext && !isLast) setGap(3)
    }
  }, [remaining, running, current, perSide, side, total, doneSet, toggle, today, autoNext, isLast])

  // Mantém a tela acesa durante o timer.
  useEffect(() => {
    if (running && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((w) => (wake.current = w)).catch(() => undefined)
    }
    return () => {
      void wake.current?.release().catch(() => undefined)
      wake.current = null
    }
  }, [running])

  if (!current) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-muted">Sem alongamentos para cronometrar.</p>
        <Link to="/" className="btn">Voltar</Link>
      </div>
    )
  }

  const pct = total > 0 ? 1 - Math.max(0, remaining) / total : 1
  const R = 90
  const C = 2 * Math.PI * R

  return (
    <div className="text-center">
      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-fg"><Icon name="back" size={14} /> Hoje</Link>
        <span className="font-mono">{idx + 1} / {list.length}</span>
      </div>

      <h1 className="text-xl font-semibold">{current.name}</h1>
      <p className="mt-1 min-h-[20px] text-sm text-muted">
        {[current.body_area, current.notes].filter(Boolean).join(' · ')}
      </p>

      <div className="relative mx-auto my-6 h-56 w-56">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="#21262d" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={finished ? '#a371f7' : '#2f81f7'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-semibold tabular-nums">{fmtClock(Math.max(0, remaining))}</span>
          {perSide && <span className="mt-1 text-xs text-muted">Lado {side} de 2</span>}
        </div>
      </div>

      <p className={`mb-4 min-h-[24px] text-sm font-semibold ${notice ? 'text-attention' : 'text-brand-fg'}`}>
        {gap !== null && list[idx + 1]
          ? `Feito! Próximo em ${gap}s: ${list[idx + 1].name}`
          : finished
            ? 'Feito! Marcado no checklist.'
            : notice}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {!finished ? (
          <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pausar' : remaining < total ? 'Continuar' : 'Começar'}
          </button>
        ) : (
          <button className="btn" onClick={() => { setGap(null); setRemaining(total); setSide(1); setFinished(false) }}>Repetir</button>
        )}
        <button
          className={`btn ${finished ? 'btn-primary' : ''}`}
          onClick={() => {
            if (isLast) return
            autoStart.current = autoNext && (running || finished)
            setGap(null)
            setIdx(idx + 1)
          }}
          disabled={isLast}
        >
          {isLast ? 'Último' : 'Próximo'}
        </button>
      </div>

      <label className="mt-5 inline-flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={perSide}
          onChange={(e) => {
            setPerSide(e.target.checked)
            localStorage.setItem('nr-per-side', e.target.checked ? '1' : '0')
          }}
          className="h-4 w-4 accent-[#2f81f7]"
        />
        Contar por lado (tempo × 2, com aviso para trocar)
      </label>
      <label className="mt-2 flex items-center justify-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={autoNext}
          onChange={(e) => {
            setAutoNext(e.target.checked)
            localStorage.setItem('nr-auto-next', e.target.checked ? '1' : '0')
            if (!e.target.checked) setGap(null)
          }}
          className="h-4 w-4 accent-[#2f81f7]"
        />
        Continuar sozinho para o próximo alongamento
      </label>
      {isLast && finished && (
        <p className="mt-6 text-sm text-brand-fg">Fim da rotina. Volte para “Hoje” para ver o progresso.</p>
      )}
    </div>
  )
}
