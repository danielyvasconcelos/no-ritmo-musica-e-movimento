export type Profile = { user_id: string; weekly_goal_days: number; timezone: string }

export type Stretch = {
  id: string
  user_id: string
  name: string
  body_area: string | null
  duration_seconds: number | null
  reps: number | null
  notes: string | null
  archived: boolean
  created_at: string
}

export type Routine = { id: string; user_id: string; name: string; position: number }
export type RoutineStretch = { user_id: string; routine_id: string; stretch_id: string; position: number }
export type Check = { id?: string; user_id: string; stretch_id: string; date: string; done_at: string }

export type LessonCategory = 'aquecimento' | 'tecnica' | 'coreografia' | 'alongamento'
export type LessonLevel = 'iniciante' | 'intermediario' | 'avancado'

export type Lesson = {
  id: string
  user_id: string
  youtube_url: string
  title: string
  thumbnail_url: string | null
  category: LessonCategory
  dance_style: string | null
  level: LessonLevel | null
  favorite: boolean
  tutorial_notes: string | null
  created_at: string
}

export type LessonMark = { id: string; user_id: string; lesson_id: string; seconds: number; label: string }

export type SessionType = 'alongamento' | 'aula' | 'danca_livre' | 'forca'

export type Session = {
  id: string
  user_id: string
  date: string
  type: SessionType
  duration_min: number
  lesson_id: string | null
  feeling: number | null
  pain_level: number | null
  notes: string | null
  is_minimum: boolean
  created_at: string
}

export const CATEGORY_LABEL: Record<LessonCategory, string> = {
  aquecimento: 'Aquecimento',
  tecnica: 'Técnica',
  coreografia: 'Coreografia',
  alongamento: 'Alongamento',
}
export const LEVEL_LABEL: Record<LessonLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}
export const SESSION_LABEL: Record<SessionType, string> = {
  alongamento: 'Alongamento',
  aula: 'Aula',
  danca_livre: 'Dança livre',
  forca: 'Força',
}
