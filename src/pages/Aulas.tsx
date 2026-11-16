import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLessons } from '../lib/api'
import { CATEGORY_LABEL, LEVEL_LABEL, type LessonCategory } from '../lib/types'
import { parseYouTubeId, thumbFor } from '../lib/youtube'
import { Empty, Icon, PageTitle } from '../components/ui'

export default function Aulas() {
  const lessons = useLessons()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<LessonCategory | 'fav' | ''>('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (lessons.data ?? []).filter((l) => {
      if (cat === 'fav' && !l.favorite) return false
      if (cat && cat !== 'fav' && l.category !== cat) return false
      return !term || l.title.toLowerCase().includes(term)
    })
  }, [lessons.data, q, cat])

  return (
    <div>
      <PageTitle
        title="Aulas"
        sub="Sua biblioteca de aulas do YouTube."
        right={<Link to="/aulas/nova" className="btn btn-primary"><Icon name="plus" size={14} /> Nova</Link>}
      />
      <input className="input mb-3" type="search" placeholder="Buscar por título…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className={`chip ${cat === '' ? 'chip-on' : ''}`} onClick={() => setCat('')}>Todas</button>
        <button className={`chip ${cat === 'fav' ? 'chip-on' : ''}`} onClick={() => setCat('fav')}>★ Favoritas</button>
        {(Object.keys(CATEGORY_LABEL) as LessonCategory[]).map((c) => (
          <button key={c} className={`chip ${cat === c ? 'chip-on' : ''}`} onClick={() => setCat(c)}>{CATEGORY_LABEL[c]}</button>
        ))}
      </div>

      {lessons.isLoading && !lessons.data ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Empty>{(lessons.data?.length ?? 0) === 0 ? 'Cole o link de uma aula do YouTube para começar.' : 'Nada encontrado com esses filtros.'}</Empty>
      ) : (
        <ul className="space-y-3">
          {filtered.map((l) => {
            const vid = parseYouTubeId(l.youtube_url)
            const img = l.thumbnail_url || (vid ? thumbFor(vid) : '')
            return (
              <li key={l.id}>
                <Link to={`/aulas/${l.id}`} className="card flex gap-3 overflow-hidden p-2 transition hover:border-muted active:bg-overlay">
                  {img ? (
                    <img src={img} alt="" loading="lazy" className="h-[72px] w-32 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-[72px] w-32 shrink-0 rounded bg-overlay" />
                  )}
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="line-clamp-2 text-sm font-medium">
                      {l.favorite && <span className="text-attention">★ </span>}
                      {l.title}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted">
                      {[CATEGORY_LABEL[l.category], l.dance_style, l.level ? LEVEL_LABEL[l.level] : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
