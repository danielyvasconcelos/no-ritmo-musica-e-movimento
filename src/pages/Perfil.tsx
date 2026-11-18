import { useState, type FormEvent, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { displayName, useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useProfile, useUpdateProfile } from '../lib/api'
import { browserTz } from '../lib/dates'
import { clearQueue } from '../lib/offline'
import { clearPersisted } from '../lib/persist'
import { ErrorText } from '../components/ui'
import PasswordForm from '../components/PasswordForm'
import StretchManager from '../components/StretchManager'
import RoutineManager from '../components/RoutineManager'

function zones(current: string): string[] {
  const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? []
  return list.includes(current) ? list : [current, ...list]
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="card divide-y divide-line overflow-hidden">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm">{label}</span>
      <div className="min-w-0 text-right text-sm text-muted">{children}</div>
    </div>
  )
}

function Fold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 py-3 text-sm marker:hidden">
        {title}
        <span className="text-muted transition group-open:rotate-90">›</span>
      </summary>
      <div className="border-t border-line bg-canvas p-3">{children}</div>
    </details>
  )
}

export default function Perfil() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const profile = useProfile()
  const update = useUpdateProfile()
  const goal = profile.data?.weekly_goal_days ?? 5
  const tz = profile.data?.timezone ?? browserTz()

  const name = displayName(user)
  const email = user?.email ?? ''
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(name)
  const [nameError, setNameError] = useState<unknown>(null)
  const [savingName, setSavingName] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)

  async function saveName(e: FormEvent) {
    e.preventDefault()
    setSavingName(true)
    setNameError(null)
    const { error } = await supabase.auth.updateUser({ data: { full_name: nameDraft.trim() } })
    setSavingName(false)
    if (error) return setNameError(error)
    setEditingName(false)
  }

  async function signOut() {
    await clearQueue()
    await clearPersisted()
    qc.clear()
    await supabase.auth.signOut()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-line bg-brand text-3xl font-semibold text-white">
          {(name || email).charAt(0).toUpperCase()}
        </div>
        <h1 className="mt-3 text-xl font-semibold">{name}</h1>
        <p className="text-sm text-muted">{email}</p>
      </div>

      <Group title="Conta">
        {editingName ? (
          <form onSubmit={saveName} className="space-y-3 p-4">
            <label className="label" htmlFor="nome">Nome</label>
            <input id="nome" className="input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus required />
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" disabled={savingName}>{savingName ? 'Salvando…' : 'Salvar'}</button>
              <button type="button" className="btn" onClick={() => { setEditingName(false); setNameDraft(name) }}>Cancelar</button>
            </div>
            <ErrorText error={nameError} />
          </form>
        ) : (
          <Row label="Nome">
            <button className="max-w-[14rem] truncate text-fg hover:underline" onClick={() => { setNameDraft(name); setEditingName(true) }}>
              {name} <span className="text-accent">Editar</span>
            </button>
          </Row>
        )}
        <Row label="E-mail"><span className="block max-w-[14rem] truncate">{email}</span></Row>
        {pwOpen ? (
          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Redefinir senha</h3>
            <PasswordForm onDone={() => setPwOpen(false)} onCancel={() => setPwOpen(false)} />
          </div>
        ) : (
          <Row label="Senha">
            <button className="btn" onClick={() => setPwOpen(true)}>Redefinir senha</button>
          </Row>
        )}
      </Group>

      <Group title="Preferências">
        <Row label="Meta semanal">
          <div className="flex items-center gap-3 text-fg">
            <button className="btn px-3" disabled={goal <= 1} onClick={() => update.mutate({ weekly_goal_days: goal - 1 })} aria-label="Diminuir">−</button>
            <span className="w-14 text-center font-mono">{goal} {goal === 1 ? 'dia' : 'dias'}</span>
            <button className="btn px-3" disabled={goal >= 7} onClick={() => update.mutate({ weekly_goal_days: goal + 1 })} aria-label="Aumentar">+</button>
          </div>
        </Row>
        <div className="px-4 py-3">
          <label className="mb-1 block text-sm" htmlFor="tz">Fuso horário</label>
          <select id="tz" className="input" value={tz} onChange={(e) => update.mutate({ timezone: e.target.value })}>
            {zones(tz).map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <p className="mt-1 text-xs text-muted">Define a hora em que o dia vira.</p>
          <ErrorText error={update.error} />
        </div>
      </Group>

      <Group title="Meus treinos">
        <Fold title="Alongamentos"><StretchManager /></Fold>
        <Fold title="Rotinas"><RoutineManager /></Fold>
      </Group>

      <button className="btn btn-danger w-full" onClick={signOut}>Sair da conta</button>
    </div>
  )
}
