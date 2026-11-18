import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session as AuthSession, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthCtx = { user: User | null; loading: boolean; recovery: boolean; clearRecovery: () => void }
const Ctx = createContext<AuthCtx>({ user: null, loading: true, recovery: false, clearRecovery: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const clearRecovery = useCallback(() => setRecovery(false), [])

  return <Ctx.Provider value={{ user: session?.user ?? null, loading, recovery, clearRecovery }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
export const useUserId = () => useAuth().user?.id ?? ''

/** Nome de exibição: nome salvo no perfil ou, na falta, a parte do e-mail antes do @. */
export function displayName(user: User | null): string {
  const meta = (user?.user_metadata ?? {}) as { full_name?: string }
  return meta.full_name?.trim() || user?.email?.split('@')[0] || ''
}
