import { useState, type FormEvent } from 'react'
import {
  useDeleteRoutine,
  useRoutines,
  useRoutineStretches,
  useSaveRoutine,
  useSetRoutineStretches,
  useStretches,
} from '../lib/api'
import type { Routine } from '../lib/types'
import { ErrorText, Icon } from './ui'

function Editor({ routine }: { routine: Routine }) {
  const stretches = useStretches()
  const links = useRoutineStretches()
  const setStretches = useSetRoutineStretches()
  const saveRoutine = useSaveRoutine()
  const del = useDeleteRoutine()

  const current = (links.data ?? []).filter((l) => l.routine_id === routine.id).sort((a, b) => a.position - b.position).map((l) => l.stretch_id)
  const all = (stretches.data ?? []).filter((s) => !s.archived)
  const name = (id: string) => all.find((s) => s.id === id)?.name ?? '(arquivado)'
  const available = all.filter((s) => !current.includes(s.id))
  const [title, setTitle] = useState(routine.name)

  const apply = (ids: string[]) => setStretches.mutate({ routineId: routine.id, stretchIds: ids })
  const move = (i: number, d: -1 | 1) => {
    const ids = [...current]
    const j = i + d
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    apply(ids)
  }

  return (
    <div className="space-y-3 border-t border-line p-4">
      <div className="flex gap-2">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Nome da rotina" />
        <button className="btn" disabled={!title.trim() || title === routine.name} onClick={() => saveRoutine.mutate({ id: routine.id, name: title.trim() })}>Renomear</button>
      </div>

      <ol className="divide-y divide-line rounded-md border border-line">
        {current.map((id, i) => (
          <li key={id} className="flex items-center gap-1 px-3 py-2 text-sm">
            <span className="w-5 font-mono text-xs text-muted">{i + 1}</span>
            <span className="flex-1 truncate">{name(id)}</span>
            <button className="btn btn-ghost px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir"><Icon name="up" size={14} /></button>
            <button className="btn btn-ghost px-2" onClick={() => move(i, 1)} disabled={i === current.length - 1} aria-label="Descer"><Icon name="down" size={14} /></button>
            <button className="btn btn-ghost px-2 hover:text-danger" onClick={() => apply(current.filter((x) => x !== id))} aria-label="Remover"><Icon name="trash" size={14} /></button>
          </li>
        ))}
        {current.length === 0 && <li className="px-3 py-3 text-center text-xs text-muted">Rotina vazia.</li>}
      </ol>

      {available.length > 0 && (
        <select
          className="input"
          value=""
          onChange={(e) => e.target.value && apply([...current, e.target.value])}
          aria-label="Adicionar alongamento"
        >
          <option value="">+ Adicionar alongamento…</option>
          {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      <button className="btn btn-danger" onClick={() => confirm(`Excluir a rotina “${routine.name}”?`) && del.mutate(routine.id)}>
        <Icon name="trash" size={14} /> Excluir rotina
      </button>
      <ErrorText error={setStretches.error ?? saveRoutine.error ?? del.error} />
    </div>
  )
}

export default function RoutineManager() {
  const routines = useRoutines()
  const save = useSaveRoutine()
  const [open, setOpen] = useState<string | null>(null)
  const [name, setName] = useState('')

  function add(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    save.mutate(
      { name: name.trim(), position: routines.data?.length ?? 0 },
      { onSuccess: (r) => { setName(''); setOpen(r.id) } },
    )
  }

  return (
    <div className="card overflow-hidden">
      <ul>
        {(routines.data ?? []).map((r) => (
          <li key={r.id} className="border-b border-line last:border-b-0">
            <button className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium" onClick={() => setOpen(open === r.id ? null : r.id)}>
              {r.name}
              <Icon name={open === r.id ? 'up' : 'down'} size={14} className="text-muted" />
            </button>
            {open === r.id && <Editor routine={r} />}
          </li>
        ))}
        {(routines.data?.length ?? 0) === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Crie rotinas como “Manhã” e “Pós-aula”.</li>}
      </ul>
      <form onSubmit={add} className="flex gap-2 border-t border-line p-3">
        <input className="input" placeholder="Nova rotina (ex.: Manhã)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary" disabled={save.isPending}>Criar</button>
      </form>
      <ErrorText error={save.error} />
    </div>
  )
}
