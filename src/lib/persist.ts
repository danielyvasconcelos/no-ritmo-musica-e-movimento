import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query'
import { del, get, set } from 'idb-keyval'

const KEY = 'nr-query-cache'
type Stored = { userId: string; state: ReturnType<typeof dehydrate> }

/** Restaura o último cache salvo (somente do mesmo usuário) para abrir offline. */
export async function restoreCache(qc: QueryClient, userId: string) {
  const stored = (await get(KEY).catch(() => undefined)) as Stored | undefined
  if (stored && stored.userId === userId) hydrate(qc, stored.state)
}

export function startPersist(qc: QueryClient, userId: string) {
  let t: number | undefined
  const save = () => {
    window.clearTimeout(t)
    t = window.setTimeout(() => {
      void set(KEY, { userId, state: dehydrate(qc) } satisfies Stored).catch(() => undefined)
    }, 800)
  }
  const unsub = qc.getQueryCache().subscribe(save)
  return () => {
    unsub()
    window.clearTimeout(t)
  }
}

export const clearPersisted = () => del(KEY).catch(() => undefined)
