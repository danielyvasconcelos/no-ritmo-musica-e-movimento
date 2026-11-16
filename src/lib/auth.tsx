import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session as AuthSession, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthCtx = { user: User | null; loading: boolean }
const Ctx = createContext<AuthCtx>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  return <Ctx.Provider value={{ user: session?.user ?? null, loading }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
export const useUserId = () => useAuth().user?.id ?? ''
