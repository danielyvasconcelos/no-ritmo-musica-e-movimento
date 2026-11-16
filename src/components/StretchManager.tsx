import { useState, type FormEvent } from 'react'
import { useSaveStretch, useStretches, type StretchInput } from '../lib/api'
import type { Stretch } from '../lib/types'
import { ErrorText } from './ui'

const blank: StretchInput = { name: '', body_area: null, duration_seconds: 30, reps: null, notes: null }

function Form({ initial, onDone }: { initial: StretchInput; onDone: () => void }) {
  const save = useSaveStretch()
  const [f, setF] = useState(initial)
  const num = (v: string) => (v === '' ? null : Math.max(0, Number(v)))

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate(
      { ...f, name: f.name.trim(), body_area: f.body_area?.trim() || null, notes: f.notes?.trim() || null },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4">
      <div>
        <label className="label">Nome</label>
        <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoFocus />
      </div>
      <div>
        <label className="label">Região do corpo</label>
        <input className="input" placeholder="ex.: posterior de coxa" value={f.body_area ?? ''} onChange={(e) => setF({ ...f, body_area: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Duração (s)</label>
          <input className="input" type="number" inputMode="numeric" value={f.duration_seconds ?? ''} onChange={(e) => setF({ ...f, duration_seconds: num(e.target.value) })} />
        </div>
        <div>
          <label className="label">Repetições</label>
          <input className="input" type="number" inputMode="numeric" value={f.reps ?? ''} onChange={(e) => setF({ ...f, reps: num(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="label">Observação</label>
        <input className="input" value={f.notes ?? ''} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary flex-1" disabled={save.isPending}>Salvar</button>
        <button type="button" className="btn" onClick={onDone}>Cancelar</button>
      </div>
      <ErrorText error={save.error} />
    </form>
  )
}

export default function StretchManager() {
  const stretches = useStretches()
  const save = useSaveStretch()
  const [editing, setEditing] = useState<Stretch | 'new' | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const list = (stretches.data ?? []).filter((s) => showArchived || !s.archived)

  return (
    <div className="card overflow-hidden">
      {editing ? (
        <Form
          initial={editing === 'new' ? blank : { id: editing.id, name: editing.name, body_area: editing.body_area, duration_seconds: editing.duration_seconds, reps: editing.reps, notes: editing.notes }}
          onDone={() => setEditing(null)}
        />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-2 px-4 py-3">
                <div className={`min-w-0 flex-1 ${s.archived ? 'opacity-50' : ''}`}>
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="truncate text-xs text-muted">
                    {[s.body_area, s.duration_seconds ? `${s.duration_seconds}s` : null, s.reps ? `${s.reps} reps` : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button className="btn btn-ghost px-2 text-xs" onClick={() => setEditing(s)}>Editar</button>
                <button
                  className="btn btn-ghost px-2 text-xs"
                  onClick={() =>
                    save.mutate({ id: s.id, name: s.name, body_area: s.body_area, duration_seconds: s.duration_seconds, reps: s.reps, notes: s.notes, archived: !s.archived })
                  }
                >
                  {s.archived ? 'Restaurar' : 'Arquivar'}
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Nenhum alongamento.</li>}
          </ul>
          <div className="flex items-center justify-between border-t border-line p-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" className="accent-[#2f81f7]" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Mostrar arquivados
            </label>
            <button className="btn btn-primary" onClick={() => setEditing('new')}>Novo alongamento</button>
          </div>
          <ErrorText error={save.error} />
        </>
      )}
    </div>
  )
}
