import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDeleteSession, useLessons, useSaveSession, useSessions } from '../lib/api'
import { useToday } from '../hooks/useToday'
import { SESSION_LABEL, type SessionType } from '../lib/types'
import { Icon, Segmented } from '../components/ui'

const faces = ['😞', '😕', '😐', '🙂', '😄']

export default function TreinoForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const today = useToday()
  const sessions = useSessions()
  const lessons = useLessons()
  const save = useSaveSession()
  const remove = useDeleteSession()
  const editing = id ? (sessions.data ?? []).find((s) => s.id === id) : undefined

  const [date, setDate] = useState(editing?.date ?? today)
  const [type, setType] = useState<SessionType>(editing?.type ?? 'aula')
  const [duration, setDuration] = useState(editing?.duration_min ?? 30)
  const [lessonId, setLessonId] = useState(editing?.lesson_id ?? '')
  const [feeling, setFeeling] = useState<number | null>(editing?.feeling ?? 3)
  const [pain, setPain] = useState<number | null>(editing?.pain_level ?? 0)
  const [notes, setNotes] = useState(editing?.notes ?? '')

  if (id && !editing) {
    return sessions.isLoading ? (
      <p className="text-sm text-muted">Carregando…</p>
    ) : (
      <p className="text-sm text-muted">Sessão não encontrada. <Link className="text-accent" to="/treinos">Voltar</Link></p>
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    save({
      id: editing?.id,
      date,
      type,
      duration_min: Math.max(1, Number(duration) || 1),
      lesson_id: lessonId || null,
      feeling,
      pain_level: pain,
      notes: notes.trim() || null,
      is_minimum: editing?.is_minimum ?? false,
    })
    nav('/treinos')
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/treinos" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><Icon name="back" size={14} /> Treinos</Link>
        <h1 className="text-lg font-semibold">{editing ? 'Editar sessão' : 'Nova sessão'}</h1>
        <span className="w-12" />
      </div>

      <div>
        <span className="label">Tipo</span>
        <Segmented
          value={type}
          onChange={setType}
          options={(Object.keys(SESSION_LABEL) as SessionType[]).map((t) => ({ value: t, label: SESSION_LABEL[t] }))}
        />
      </div>

      <div>
        <label className="label" htmlFor="dur">Duração (min)</label>
        <input id="dur" className="input mb-2" type="number" inputMode="numeric" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        <Segmented value={duration} onChange={setDuration} options={[5, 15, 30, 45, 60].map((v) => ({ value: v, label: `${v}` }))} />
      </div>

      <div>
        <span className="label">Como me senti</span>
        <Segmented value={feeling} onChange={setFeeling} options={faces.map((f, i) => ({ value: i + 1, label: `${f} ${i + 1}` }))} />
      </div>

      <div>
        <span className="label">Dor (0 = nenhuma)</span>
        <Segmented value={pain} onChange={setPain} options={[0, 1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="date">Data</label>
          <input id="date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="lesson">Aula usada</label>
          <select id="lesson" className="input" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">—</option>
            {(lessons.data ?? []).map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">Observação</label>
        <input id="notes" className="input" placeholder="ex.: joelho sensível" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button className="btn btn-primary flex-1">Salvar</button>
        {editing && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (confirm('Excluir esta sessão?')) {
                remove(editing.id)
                nav('/treinos')
              }
            }}
          >
            <Icon name="trash" size={14} /> Excluir
          </button>
        )}
      </div>
    </form>
  )
}
