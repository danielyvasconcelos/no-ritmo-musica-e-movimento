import { del, get, set } from 'idb-keyval'
import { supabase } from './supabase'
import type { Session } from './types'

export type SessionRow = Omit<Session, 'created_at'> & { created_at?: string }

export type Op =
  | { id: string; kind: 'check_on'; user_id: string; stretch_id: string; date: string; done_at: string }
  | { id: string; kind: 'check_off'; user_id: string; stretch_id: string; date: string }
  | { id: string; kind: 'day_on'; user_id: string; date: string }
  | { id: string; kind: 'day_off'; date: string }
  | { id: string; kind: 'session_upsert'; row: SessionRow }
  | { id: string; kind: 'session_delete'; session_id: string }

type OpInput = Op extends infer O ? (O extends Op ? Omit<O, 'id'> : never) : never

const KEY = 'nr-queue'
let queue: Op[] = []
let flushing = false
let hadFailure = false
let onDrained: (() => void) | null = null
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((l) => l())
const persist = () => void set(KEY, queue).catch(() => undefined)

export const pendingCount = () => queue.length
export function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export const setOnDrained = (cb: (() => void) | null) => {
  onDrained = cb
}

export async function loadQueue() {
  const stored = ((await get(KEY).catch(() => undefined)) as Op[] | undefined) ?? []
  queue = [...stored, ...queue]
  notify()
}

export async function clearQueue() {
  queue = []
  await del(KEY).catch(() => undefined)
  notify()
}

export function enqueue(op: OpInput) {
  queue.push({ ...op, id: crypto.randomUUID() } as Op)
  persist()
  notify()
  void flush()
}

type Err = { message?: string; status?: number } | null

const isNetwork = (e: Err) => !!e && (e.status === 0 || /fetch|network|load failed|timeout/i.test(e.message ?? ''))

async function run(op: Op): Promise<Err> {
  switch (op.kind) {
    case 'check_on': {
      const { error } = await supabase
        .from('stretch_checks')
        .upsert(
          { user_id: op.user_id, stretch_id: op.stretch_id, date: op.date, done_at: op.done_at },
          { onConflict: 'stretch_id,date' },
        )
      return error
    }
    case 'check_off': {
      const { error } = await supabase.from('stretch_checks').delete().eq('stretch_id', op.stretch_id).eq('date', op.date)
      return error
    }
    case 'day_on': {
      const { error } = await supabase
        .from('stretch_days')
        .upsert({ user_id: op.user_id, date: op.date }, { onConflict: 'user_id,date' })
      return error
    }
    case 'day_off': {
      const { error } = await supabase.from('stretch_days').delete().eq('date', op.date)
      return error
    }
    case 'session_upsert': {
      const { error } = await supabase.from('workout_sessions').upsert(op.row, { onConflict: 'id' })
      return error
    }
    case 'session_delete': {
      const { error } = await supabase.from('workout_sessions').delete().eq('id', op.session_id)
      return error
    }
  }
}

export async function flush() {
  if (flushing) return
  flushing = true
  try {
    while (queue.length) {
      if (!navigator.onLine) {
        hadFailure = true
        break
      }
      const err = await run(queue[0])
      if (err && isNetwork(err)) {
        hadFailure = true
        break
      }
      if (err) console.warn('Operação descartada pela API:', err.message)
      queue.shift()
      persist()
      notify()
    }
  } finally {
    flushing = false
  }
  if (!queue.length && hadFailure) {
    hadFailure = false
    onDrained?.()
  }
}

let timer: number | undefined
export function startSync() {
  const trigger = () => void flush()
  window.addEventListener('online', trigger)
  timer = window.setInterval(() => queue.length && trigger(), 20_000)
  trigger()
  return () => {
    window.removeEventListener('online', trigger)
    window.clearInterval(timer)
  }
}
