import { useEffect, useState } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './lib/auth'
import { isConfigured } from './lib/supabase'
import { clearPersisted, restoreCache, startPersist } from './lib/persist'
import { loadQueue, setOnDrained, startSync } from './lib/offline'
import Layout from './components/Layout'
import Login from './pages/Login'
import Hoje from './pages/Hoje'
import Timer from './pages/Timer'
import Aulas from './pages/Aulas'
import AulaForm from './pages/AulaForm'
import AulaDetalhe from './pages/AulaDetalhe'
import Treinos from './pages/Treinos'
import TreinoForm from './pages/TreinoForm'
import Progresso from './pages/Progresso'
import Perfil from './pages/Perfil'

function Splash({ children }: { children?: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-muted">{children ?? 'Carregando…'}</div>
}

function Setup() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-xl font-semibold">Falta conectar o Supabase</h1>
      <p className="mb-4 text-sm text-muted">
        Copie <code className="font-mono text-fg">.env.example</code> para <code className="font-mono text-fg">.env</code> e preencha a URL e a
        chave anon do seu projeto. Depois rode o SQL de <code className="font-mono text-fg">supabase/schema.sql</code> no SQL Editor e reinicie o
        <code className="font-mono text-fg"> npm run dev</code>.
      </p>
    </div>
  )
}

/** Quando há usuário logado: restaura o cache offline, liga a fila de sincronização e libera o app. */
function Authed() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [ready, setReady] = useState(false)
  const uid = user!.id

  useEffect(() => {
    let stopPersist = () => {}
    let stopSync = () => {}
    let cancelled = false
    ;(async () => {
      await restoreCache(qc, uid)
      await loadQueue()
      if (cancelled) return
      stopPersist = startPersist(qc, uid)
      setOnDrained(() => {
        void qc.invalidateQueries({ queryKey: ['checks'] })
        void qc.invalidateQueries({ queryKey: ['sessions'] })
      })
      stopSync = startSync()
      setReady(true)
    })()
    return () => {
      cancelled = true
      stopPersist()
      stopSync()
      setOnDrained(null)
    }
  }, [qc, uid])

  if (!ready) return <Splash />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Hoje />} />
        <Route path="/hoje/timer" element={<Timer />} />
        <Route path="/aulas" element={<Aulas />} />
        <Route path="/aulas/nova" element={<AulaForm />} />
        <Route path="/aulas/:id" element={<AulaDetalhe />} />
        <Route path="/treinos" element={<Treinos />} />
        <Route path="/treinos/novo" element={<TreinoForm />} />
        <Route path="/treinos/:id" element={<TreinoForm />} />
        <Route path="/progresso" element={<Progresso />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const qc = useQueryClient()

  // Ao sair, limpa dados locais do usuário anterior.
  useEffect(() => {
    if (!loading && !user) {
      qc.clear()
      void clearPersisted()
    }
  }, [loading, user, qc])

  if (!isConfigured) return <Setup />
  if (loading) return <Splash />
  if (!user) return <Login />
  return <Authed />
}
