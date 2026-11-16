import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useProfile, useUpdateProfile } from '../lib/api'
import { browserTz } from '../lib/dates'
import { clearQueue } from '../lib/offline'
import { clearPersisted } from '../lib/persist'
import { ErrorText, PageTitle } from '../components/ui'
import StretchManager from '../components/StretchManager'
import RoutineManager from '../components/RoutineManager'

function zones(current: string): string[] {
  const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? []
  return list.includes(current) ? list : [current, ...list]
}

export default function Perfil() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const profile = useProfile()
  const update = useUpdateProfile()
  const goal = profile.data?.weekly_goal_days ?? 5
  const tz = profile.data?.timezone ?? browserTz()

  async function signOut() {
    await clearQueue()
    await clearPersisted()
    qc.clear()
    await supabase.auth.signOut()
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Perfil" sub={user?.email ?? ''} />

      <section>
        <h2 className="mb-2 text-sm font-semibold">Meta semanal</h2>
        <div className="card flex items-center justify-between p-4">
          <span className="text-sm">Dias por semana</span>
          <div className="flex items-center gap-3">
            <button className="btn px-3" disabled={goal <= 1} onClick={() => update.mutate({ weekly_goal_days: goal - 1 })} aria-label="Diminuir">−</button>
            <span className="w-6 text-center font-mono text-lg">{goal}</span>
            <button className="btn px-3" disabled={goal >= 7} onClick={() => update.mutate({ weekly_goal_days: goal + 1 })} aria-label="Aumentar">+</button>
          </div>
        </div>
        <div className="mt-3">
          <label className="label" htmlFor="tz">Fuso horário (define a virada do dia)</label>
          <select id="tz" className="input" value={tz} onChange={(e) => update.mutate({ timezone: e.target.value })}>
            {zones(tz).map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <ErrorText error={update.error} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Alongamentos</h2>
        <StretchManager />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Rotinas</h2>
        <RoutineManager />
      </section>

      <button className="btn btn-danger w-full" onClick={signOut}>Sair</button>
    </div>
  )
}
