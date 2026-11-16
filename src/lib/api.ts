import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useUserId } from './auth'
import { addDays, browserTz, todayIn } from './dates'
import { enqueue, type SessionRow } from './offline'
import type { Check, Lesson, LessonMark, Profile, Routine, RoutineStretch, Session, Stretch } from './types'

type Res<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>

async function unwrap<T>(p: Res<T>): Promise<T> {
  const { data, error } = await p
  if (error) throw new Error(error.message)
  return data as T
}

async function fetchAll<T>(build: (from: number, to: number) => Res<T[]>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const rows = await unwrap(build(from, from + 999))
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out
}

const HISTORY_DAYS = 400
const since = () => addDays(todayIn(browserTz()), -HISTORY_DAYS)

/* ---------- Perfil ---------- */
export function useProfile() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['profile'],
    enabled: !!uid,
    queryFn: async (): Promise<Profile> => {
      const found = await unwrap<Profile>(supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle())
      if (found) return found
      const row = { user_id: uid, weekly_goal_days: 5, timezone: browserTz() }
      return unwrap<Profile>(supabase.from('profiles').insert(row).select().single())
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'weekly_goal_days' | 'timezone'>>) =>
      unwrap<Profile>(supabase.from('profiles').update(patch).eq('user_id', uid).select().single()),
    onSuccess: (p) => qc.setQueryData(['profile'], p),
  })
}

/* ---------- Alongamentos e rotinas ---------- */
export const useStretches = () =>
  useQuery({
    queryKey: ['stretches'],
    queryFn: () => unwrap<Stretch[]>(supabase.from('stretches').select('*').order('created_at')),
  })

export const useRoutines = () =>
  useQuery({
    queryKey: ['routines'],
    queryFn: () => unwrap<Routine[]>(supabase.from('routines').select('*').order('position')),
  })

export const useRoutineStretches = () =>
  useQuery({
    queryKey: ['routine_stretches'],
    queryFn: () => unwrap<RoutineStretch[]>(supabase.from('routine_stretches').select('*').order('position')),
  })

export type StretchInput = {
  id?: string
  name: string
  body_area: string | null
  duration_seconds: number | null
  reps: number | null
  notes: string | null
  archived?: boolean
}

export function useSaveStretch() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async (s: StretchInput) => {
      if (s.id) {
        const { id, ...patch } = s
        return unwrap<Stretch>(supabase.from('stretches').update(patch).eq('id', id).select().single())
      }
      return unwrap<Stretch>(supabase.from('stretches').insert({ ...s, user_id: uid }).select().single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stretches'] }),
  })
}

export function useSaveRoutine() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async (r: { id?: string; name: string; position?: number }) => {
      if (r.id) return unwrap<Routine>(supabase.from('routines').update({ name: r.name }).eq('id', r.id).select().single())
      return unwrap<Routine>(
        supabase.from('routines').insert({ name: r.name, position: r.position ?? 0, user_id: uid }).select().single(),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  })
}

export function useDeleteRoutine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(supabase.from('routines').delete().eq('id', id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['routines'] })
      void qc.invalidateQueries({ queryKey: ['routine_stretches'] })
    },
  })
}

/** Substitui a lista (ordenada) de alongamentos de uma rotina. */
export function useSetRoutineStretches() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async ({ routineId, stretchIds }: { routineId: string; stretchIds: string[] }) => {
      await unwrap(supabase.from('routine_stretches').delete().eq('routine_id', routineId))
      if (stretchIds.length) {
        const rows = stretchIds.map((stretch_id, position) => ({
          user_id: uid,
          routine_id: routineId,
          stretch_id,
          position,
        }))
        await unwrap(supabase.from('routine_stretches').insert(rows))
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine_stretches'] }),
  })
}

/* ---------- Checks do dia ---------- */
export const useChecks = () =>
  useQuery({
    queryKey: ['checks'],
    queryFn: () =>
      fetchAll<Check>((a, b) =>
        supabase.from('stretch_checks').select('*').gte('date', since()).order('date').order('id').range(a, b),
      ),
  })

/** Marca/desmarca com atualização otimista; funciona offline (fila local). */
export function useToggleCheck() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useCallback(
    (stretch_id: string, date: string, on: boolean) => {
      const done_at = new Date().toISOString()
      qc.setQueryData<Check[]>(['checks'], (old = []) => {
        const rest = old.filter((c) => !(c.stretch_id === stretch_id && c.date === date))
        return on ? [...rest, { user_id: uid, stretch_id, date, done_at }] : rest
      })
      if (on) enqueue({ kind: 'check_on', user_id: uid, stretch_id, date, done_at })
      else enqueue({ kind: 'check_off', user_id: uid, stretch_id, date })
    },
    [qc, uid],
  )
}

/* ---------- Treinos ---------- */
export const useSessions = () =>
  useQuery({
    queryKey: ['sessions'],
    queryFn: () =>
      fetchAll<Session>((a, b) =>
        supabase
          .from('workout_sessions')
          .select('*')
          .gte('date', since())
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(a, b),
      ),
  })

export type SessionInput = Omit<Session, 'user_id' | 'created_at' | 'id'> & { id?: string }

export function useSaveSession() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useCallback(
    (input: SessionInput) => {
      const row: SessionRow = { ...input, id: input.id ?? crypto.randomUUID(), user_id: uid }
      qc.setQueryData<Session[]>(['sessions'], (old = []) => {
        const prev = old.find((s) => s.id === row.id)
        const full: Session = { ...row, created_at: prev?.created_at ?? row.created_at ?? new Date().toISOString() }
        const next = prev ? old.map((s) => (s.id === row.id ? full : s)) : [full, ...old]
        return next.sort((a, b) => (a.date === b.date ? b.created_at.localeCompare(a.created_at) : b.date.localeCompare(a.date)))
      })
      enqueue({ kind: 'session_upsert', row })
      return row.id
    },
    [qc, uid],
  )
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useCallback(
    (id: string) => {
      qc.setQueryData<Session[]>(['sessions'], (old = []) => old.filter((s) => s.id !== id))
      enqueue({ kind: 'session_delete', session_id: id })
    },
    [qc],
  )
}

/* ---------- Aulas ---------- */
export const useLessons = () =>
  useQuery({
    queryKey: ['lessons'],
    queryFn: () => unwrap<Lesson[]>(supabase.from('lessons').select('*').order('created_at', { ascending: false })),
  })

export type LessonInput = Omit<Lesson, 'id' | 'user_id' | 'created_at'> & { id?: string }

export function useSaveLesson() {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async (l: LessonInput) => {
      if (l.id) {
        const { id, ...patch } = l
        return unwrap<Lesson>(supabase.from('lessons').update(patch).eq('id', id).select().single())
      }
      return unwrap<Lesson>(supabase.from('lessons').insert({ ...l, user_id: uid }).select().single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export function useDeleteLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(supabase.from('lessons').delete().eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useMarks = (lessonId: string) =>
  useQuery({
    queryKey: ['marks', lessonId],
    queryFn: () => unwrap<LessonMark[]>(supabase.from('lesson_marks').select('*').eq('lesson_id', lessonId).order('seconds')),
  })

export function useAddMark(lessonId: string) {
  const qc = useQueryClient()
  const uid = useUserId()
  return useMutation({
    mutationFn: async (m: { seconds: number; label: string }) =>
      unwrap<LessonMark>(supabase.from('lesson_marks').insert({ ...m, lesson_id: lessonId, user_id: uid }).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marks', lessonId] }),
  })
}

export function useDeleteMark(lessonId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(supabase.from('lesson_marks').delete().eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marks', lessonId] }),
  })
}
