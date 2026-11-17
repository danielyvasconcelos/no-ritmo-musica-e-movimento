import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLessons, useSessions } from '../lib/api'
import { fmtDay } from '../lib/dates'
import { SESSION_LABEL, type Session } from '../lib/types'
import { Empty, Icon, PageTitle } from '../components/ui'

const faces = ['', '😞', '😕', '😐', '🙂', '😄']

export default function Treinos() {
  const sessions = useSessions()
  const lessons = useLessons()
  const lessonTitle = useMemo(() => new Map((lessons.data ?? []).map((l) => [l.id, l.title])), [lessons.data])

  const groups = useMemo(() => {
    const m = new Map<string, Session[]>()
    for (const s of sessions.data ?? []) m.set(s.date, [...(m.get(s.date) ?? []), s])
    return [...m.entries()]
  }, [sessions.data])

  return (
    <div>
      <PageTitle
        title="Treinos"
        sub="O diário do que você realmente fez."
        right={<Link to="/treinos/novo" className="btn btn-primary"><Icon name="plus" size={14} /> Novo</Link>}
      />
      {sessions.isLoading && !sessions.data ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : groups.length === 0 ? (
        <Empty>Nenhuma sessão registrada ainda. Cinco minutos já contam!</Empty>
      ) : (
        <div className="space-y-5">
          {groups.map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{fmtDay(date)}</h2>
              <ul className="card divide-y divide-line overflow-hidden">
                {items.map((s) => (
                  <li key={s.id}>
                    <Link to={`/treinos/${s.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-overlay">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {SESSION_LABEL[s.type]}
                          {s.is_minimum && <span className="chip border-brand-fg/40 py-0 text-brand-fg">dia mínimo</span>}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {[
                            `${s.duration_min} min`,
                            s.lesson_id ? lessonTitle.get(s.lesson_id) : null,
                            s.pain_level ? `dor ${s.pain_level}/5` : null,
                            s.notes,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <span className="text-xl" aria-label={s.feeling ? `Senti ${s.feeling} de 5` : undefined}>
                        {s.feeling ? faces[s.feeling] : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
