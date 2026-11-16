import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSaveLesson } from '../lib/api'
import { CATEGORY_LABEL, LEVEL_LABEL, type LessonCategory, type LessonLevel } from '../lib/types'
import { fetchOEmbed, parseYouTubeId, thumbFor } from '../lib/youtube'
import { ErrorText, Icon } from '../components/ui'

export default function AulaForm() {
  const nav = useNavigate()
  const save = useSaveLesson()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [thumb, setThumb] = useState('')
  const [category, setCategory] = useState<LessonCategory>('tecnica')
  const [style, setStyle] = useState('')
  const [level, setLevel] = useState<LessonLevel | ''>('')
  const [looking, setLooking] = useState(false)
  const [urlError, setUrlError] = useState('')

  async function lookup(value: string) {
    const id = parseYouTubeId(value)
    setUrlError('')
    if (!id) {
      setThumb('')
      if (value.trim()) setUrlError('Não reconheci esse link do YouTube.')
      return
    }
    setThumb(thumbFor(id))
    setLooking(true)
    const info = await fetchOEmbed(value)
    setLooking(false)
    if (info) {
      setTitle((t) => t || info.title)
      if (info.thumbnail_url) setThumb(info.thumbnail_url)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!parseYouTubeId(url)) return setUrlError('Cole um link válido do YouTube.')
    save.mutate(
      {
        youtube_url: url.trim(),
        title: title.trim() || 'Aula sem título',
        thumbnail_url: thumb || null,
        category,
        dance_style: style.trim() || null,
        level: level || null,
        favorite: false,
        tutorial_notes: null,
      },
      { onSuccess: (l) => nav(`/aulas/${l.id}`, { replace: true }) },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/aulas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><Icon name="back" size={14} /> Aulas</Link>
        <h1 className="text-lg font-semibold">Nova aula</h1>
        <span className="w-12" />
      </div>

      <div>
        <label className="label" htmlFor="url">Link do YouTube</label>
        <input
          id="url"
          className="input"
          type="url"
          inputMode="url"
          placeholder="https://youtu.be/…"
          value={url}
          onChange={(e) => { setUrl(e.target.value); void lookup(e.target.value) }}
          required
        />
        {urlError && <p className="mt-1 text-xs text-danger">{urlError}</p>}
      </div>

      {thumb && <img src={thumb} alt="" className="aspect-video w-full rounded-md border border-line object-cover" />}

      <div>
        <label className="label" htmlFor="title">Título {looking && <span className="font-normal text-muted">(buscando…)</span>}</label>
        <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <label className="label" htmlFor="cat">Categoria</label>
        <select id="cat" className="input" value={category} onChange={(e) => setCategory(e.target.value as LessonCategory)}>
          {(Object.keys(CATEGORY_LABEL) as LessonCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="style">Estilo de dança</label>
          <input id="style" className="input" placeholder="ex.: jazz, contemporâneo" value={style} onChange={(e) => setStyle(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="level">Nível</label>
          <select id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value as LessonLevel | '')}>
            <option value="">—</option>
            {(Object.keys(LEVEL_LABEL) as LessonLevel[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
          </select>
        </div>
      </div>

      <button className="btn btn-primary w-full" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar aula'}</button>
      <ErrorText error={save.error} />
    </form>
  )
}
