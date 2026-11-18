import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { ErrorText } from './ui'

export default function PasswordForm({ onDone, onCancel }: { onDone: () => void; onCancel?: () => void }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [ok, setOk] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (pw.length < 6) return setError(new Error('A senha precisa ter pelo menos 6 caracteres.'))
    if (pw !== pw2) return setError(new Error('As senhas não conferem.'))
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setError(error)
    setOk(true)
    window.setTimeout(onDone, 1200)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label" htmlFor="npw">Nova senha</label>
        <input id="npw" className="input" type="password" autoComplete="new-password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="npw2">Confirmar nova senha</label>
        <input id="npw2" className="input" type="password" autoComplete="new-password" minLength={6} required value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary flex-1" disabled={busy || ok}>{ok ? 'Senha alterada ✓' : busy ? 'Salvando…' : 'Salvar nova senha'}</button>
        {onCancel && !ok && <button type="button" className="btn" onClick={onCancel}>Cancelar</button>}
      </div>
      <ErrorText error={error} />
    </form>
  )
}
