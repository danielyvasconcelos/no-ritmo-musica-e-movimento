import { useCallback, useState } from 'react'
import { useUserId } from '../lib/auth'

/** Rotina escolhida para "hoje" ('' = todos os alongamentos ativos). Guardada no aparelho. */
export function useActiveRoutine() {
  const uid = useUserId()
  const key = `nr-routine:${uid}`
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? '')
  const set = useCallback(
    (id: string) => {
      setValue(id)
      localStorage.setItem(key, id)
    },
    [key],
  )
  return [value, set] as const
}

/** Lista ordenada dos alongamentos de hoje. */
import type { Routine, RoutineStretch, Stretch } from '../lib/types'
export function stretchesForRoutine(
  routineId: string,
  routines: Routine[],
  links: RoutineStretch[],
  stretches: Stretch[],
): Stretch[] {
  const active = stretches.filter((s) => !s.archived)
  if (!routineId || !routines.some((r) => r.id === routineId)) return active
  const byId = new Map(active.map((s) => [s.id, s]))
  return links
    .filter((l) => l.routine_id === routineId)
    .sort((a, b) => a.position - b.position)
    .map((l) => byId.get(l.stretch_id))
    .filter((s): s is Stretch => !!s)
}
