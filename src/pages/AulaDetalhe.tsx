import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAddMark, useDeleteLesson, useDeleteMark, useLessons, useMarks, useSaveLesson } from '../lib/api'
import { CATEGORY_LABEL, LEVEL_LABEL, type Lesson } from '../lib/types'
import { fmtClock, parseClock } from '../lib/dates'
import { parseYouTubeId } from '../lib/youtube'
import { ErrorText, Icon } from '../components/ui'

function Detail({ lesson }: { lesson: Lesson }) {
  const nav = useNavigate()
  const save = useSaveLesson()
  const del = useDeleteLesson()
  const marks = useMarks(lesson.id)
  const addMark = useAddMark(lesson.id)
  const delMark = useDeleteMark(lesson.id)
  const vid = parseYouTubeId(lesson.youtube_url)

  const [start, setStart] = useState(0)
  const [playKey, setPlayKey] = useState(0)
  const [notes, setNotes] = useState(lesson.tutorial_notes ?? '')
  const [time, setTime] = useState('')
  const [label, setLabel] = useState('')
  const [timeError, setTimeError] = useState('')

  useEffect(() => setNotes(lesson.tutorial_notes ?? ''), [lesson.tutorial_notes])

  const patch = (p: Partial<Lesson>) =>
    save.mutate({
      id: lesson.id,
      youtube_url: lesson.youtube_url,
      title: lesson.title,
      thumbnail_url: lesson.thumbnail_url,
      category: lesson.category,
      dance_style: lesson.dance_style,
      level: lesson.level,
      favorite: lesson.favorite,
      tutorial_notes: lesson.tutorial_notes,
      ...p,
    })

  function submitMark(e: FormEvent) {
    e.preventDefault()
    const seconds = parseClock(time)
    if (seconds === null) return setTimeError('Use o formato 3:40')
    setTimeError('')
    addMark.mutate({ seconds, label: label.trim() || fmtClock(seconds) }, { onSuccess: () => { setTime(''); setLabel('') } })
  }

  const src = vid ? `https://www.youtube.com/embed/${vid}?rel=0&playsinline=1&start=${start}${playKey ? '&autoplay=1' : ''}` : ''

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/aulas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><Icon name="back" size={14} /> Aulas</Link>
        <button
          className={`btn ${lesson.favorite ? 'text-attention' : ''}`}
          onClick={() => patch({ favorite: !lesson.favorite })}
          aria-pressed={lesson.favorite}
        >
          <Icon name="star" size={14} /> {lesson.favorite ? 'Favorita' : 'Favoritar'}
        </button>
      </div>

      {src ? (
        <iframe
          key={`${start}-${playKey}`}
          src={src}
          title={lesson.title}
          className="aspect-video w-full rounded-md border border-line bg-inset"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="card p-4 text-sm text-muted">Link inválido.</div>
      )}

      <div>
        <h1 className="text-lg font-semibold leading-snug">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {[CATEGORY_LABEL[lesson.category], lesson.dance_style, lesson.level ? LEVEL_LABEL[lesson.level] : null].filter(Boolean).join(' · ')}
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Momentos marcados</h2>
        {(marks.data?.length ?? 0) > 0 && (
          <ul className="card mb-3 divide-y divide-line overflow-hidden">
            {marks.data!.map((m) => (
              <li key={m.id} className="flex items-center">
                <button className="flex flex-1 items-center gap-3 px-4 py-3 text-left active:bg-overlay" onClick={() => { setStart(m.seconds); setPlayKey((k) => k + 1) }}>
                  <span className="font-mono text-sm text-accent">{fmtClock(m.seconds)}</span>
                  <span className="text-sm">{m.label}</span>
                </button>
                <button className="px-4 py-3 text-muted hover:text-danger" aria-label="Remover marcação" onClick={() => delMark.mutate(m.id)}>
                  <Icon name="trash" size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={submitMark} className="flex gap-2">
          <input className="input w-20 font-mono" placeholder="3:40" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Tempo" required />
          <input className="input flex-1" placeholder="ex.: giro" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Descrição" />
          <button className="btn" disabled={addMark.isPending}><Icon name="plus" size={14} /></button>
        </form>
        {timeError && <p className="mt-1 text-xs text-danger">{timeError}</p>}
        <ErrorText error={addMark.error} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Mini tutorial</h2>
        <textarea
          className="input min-h-[160px]"
          placeholder={'Passo a passo, pontos de atenção e correções que recebi…'}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button className="btn btn-primary mt-2" disabled={save.isPending || notes === (lesson.tutorial_notes ?? '')} onClick={() => patch({ tutorial_notes: notes.trim() || null })}>
          {save.isPending ? 'Salvando…' : 'Salvar tutorial'}
        </button>
        <ErrorText error={save.error} />
      </section>

      <button
        className="btn btn-danger w-full"
        onClick={() => {
          if (confirm('Excluir esta aula e suas marcações?')) del.mutate(lesson.id, { onSuccess: () => nav('/aulas', { replace: true }) })
        }}
      >
        <Icon name="trash" size={14} /> Excluir aula
      </button>
    </div>
  )
}

export default function AulaDetalhe() {
  const { id } = useParams()
  const lessons = useLessons()
  const lesson = (lessons.data ?? []).find((l) => l.id === id)
  if (!lesson) {
    return lessons.isLoading ? (
      <p className="text-sm text-muted">Carregando…</p>
    ) : (
      <p className="text-sm text-muted">Aula não encontrada. <Link className="text-accent" to="/aulas">Voltar</Link></p>
    )
  }
  return <Detail lesson={lesson} />
}
