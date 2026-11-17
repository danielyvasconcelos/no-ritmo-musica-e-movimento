import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { ErrorText } from '../components/ui'

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [info, setInfo] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo('')
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error)
      else if (!data.session) setInfo('Conta criada! Confirme o e-mail que enviamos e depois entre.')
    }
    setBusy(false)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <img src="/logo.png" alt="Dança · ETA UFAL 2026" className="mx-auto mb-4 w-44" />
        <h1 className="text-2xl font-semibold">{mode === 'in' ? 'Entrar no NoRitmo' : 'Criar conta'}</h1>
        <p className="mt-1 text-sm text-muted">Constância vale mais que intensidade.</p>
      </div>
      <form onSubmit={submit} className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Senha</label>
          <input
            id="pw"
            className="input"
            type="password"
            minLength={6}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'in' ? 'Entrar' : 'Criar conta'}
        </button>
        <ErrorText error={error} />
        {info && <p className="rounded-md border border-brand-fg/40 bg-brand/10 px-3 py-2 text-sm text-brand-fg">{info}</p>}
      </form>
      <p className="mt-4 rounded-md border border-line p-3 text-center text-sm text-muted">
        {mode === 'in' ? 'Primeira vez aqui?' : 'Já tem conta?'}{' '}
        <button className="text-accent hover:underline" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'Criar conta' : 'Entrar'}
        </button>
      </p>
    </div>
  )
}
