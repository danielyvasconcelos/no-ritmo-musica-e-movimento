-- NoRitmo · esquema do Supabase (execute inteiro no SQL Editor)
-- Todas as tabelas pertencem a um usuário (user_id) e têm Row Level Security.

create extension if not exists pgcrypto;

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_goal_days int not null default 5 check (weekly_goal_days between 1 and 7),
  timezone text not null default 'America/Sao_Paulo'
);

create table if not exists stretches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  body_area text,
  duration_seconds int,
  reps int,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  position int not null default 0
);

create table if not exists routine_stretches (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  routine_id uuid not null references routines(id) on delete cascade,
  stretch_id uuid not null references stretches(id) on delete cascade,
  position int not null default 0,
  primary key (routine_id, stretch_id)
);

create table if not exists stretch_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  stretch_id uuid not null references stretches(id) on delete cascade,
  date date not null,
  done_at timestamptz not null default now(),
  unique (stretch_id, date)
);
create index if not exists stretch_checks_user_date on stretch_checks (user_id, date);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  youtube_url text not null,
  title text not null,
  thumbnail_url text,
  category text not null check (category in ('aquecimento','tecnica','coreografia','alongamento')),
  dance_style text,
  level text check (level in ('iniciante','intermediario','avancado')),
  favorite boolean not null default false,
  tutorial_notes text,
  created_at timestamptz not null default now()
);

create table if not exists lesson_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  seconds int not null check (seconds >= 0),
  label text not null
);

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  date date not null,
  type text not null check (type in ('alongamento','aula','danca_livre','forca')),
  duration_min int not null check (duration_min > 0),
  lesson_id uuid references lessons(id) on delete set null,
  feeling int check (feeling between 1 and 5),
  pain_level int check (pain_level between 0 and 5),
  notes text,
  is_minimum boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists workout_sessions_user_date on workout_sessions (user_id, date);

-- Row Level Security: cada pessoa só lê e escreve os próprios registros.
do $$
declare t text;
begin
  foreach t in array array['profiles','stretches','routines','routine_stretches','stretch_checks','lessons','lesson_marks','workout_sessions']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "owner_all" on %I', t);
    execute format(
      'create policy "owner_all" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- "Me alonguei hoje": check do dia, sem precisar marcar item por item.
create table if not exists stretch_days (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  date date not null,
  done_at timestamptz not null default now(),
  primary key (user_id, date)
);
alter table stretch_days enable row level security;
drop policy if exists "owner_all" on stretch_days;
create policy "owner_all" on stretch_days for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
