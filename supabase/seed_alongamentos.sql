-- NoRitmo · lista inicial de alongamentos + rotina "Alongamento completo"
-- Rode no SQL Editor do Supabase DEPOIS de criar sua conta no app.
-- Pode rodar mais de uma vez: não duplica o que já existe.
--
-- Se houver só uma conta no projeto, deixe v_email vazio.
-- Se houver mais de uma, coloque o e-mail da sua conta entre aspas.

do $$
declare
  v_email   text := '';
  v_user    uuid;
  v_routine uuid;
begin
  if v_email = '' then
    if (select count(*) from auth.users) <> 1 then
      raise exception 'Há mais de uma conta: preencha v_email com o e-mail da sua conta.';
    end if;
    select id into v_user from auth.users;
  else
    select id into v_user from auth.users where lower(email) = lower(v_email);
  end if;
  if v_user is null then
    raise exception 'Conta não encontrada. Crie a conta no app primeiro.';
  end if;

  create temp table _seed (pos int, area text, name text, secs int, reps int, notes text) on commit drop;

  insert into _seed values
    (1,  'Pescoço e ombros', 'Inclinação lateral do pescoço', 20, null, 'Incline a orelha em direção ao ombro, sem levantar o ombro. 20 s de cada lado.'),
    (2,  'Pescoço e ombros', 'Alongamento de ombro cruzado', 20, null, 'Leve um braço esticado na frente do peito e puxe com o outro braço. 20 s de cada lado.'),
    (3,  'Pescoço e ombros', 'Rotação de ombros', null, 10, 'Gire os ombros para trás e para frente, 10 vezes cada.'),
    (4,  'Costas e tronco', 'Gato-vaca (em quatro apoios)', null, 10, 'Alterne entre arredondar e arquear a coluna, 10 repetições lentas.'),
    (5,  'Costas e tronco', 'Postura da criança', 30, null, 'Sente sobre os calcanhares e estique os braços à frente, com a testa no chão.'),
    (6,  'Costas e tronco', 'Torção sentada', 20, null, 'Sentada com as pernas cruzadas ou esticadas, gire o tronco para um lado, segurando o joelho. 20 s de cada lado.'),
    (7,  'Costas e tronco', 'Inclinação lateral em pé', 20, null, 'Braço acima da cabeça, incline o tronco para o lado. 20 s de cada lado.'),
    (8,  'Quadril', 'Borboleta', 30, null, 'Sentada, com as solas dos pés juntas, deixe os joelhos caírem para os lados e incline levemente o tronco à frente.'),
    (9,  'Quadril', 'Flexor do quadril (avanço baixo)', 30, null, 'Um joelho no chão, empurre o quadril à frente. 30 s de cada lado.'),
    (10, 'Quadril', 'Pombo (versão simples)', 30, null, 'Ótimo para o glúteo e a lateral do quadril. 30 s de cada lado.'),
    (11, 'Pernas', 'Posterior de coxa sentada', 30, null, 'Com as pernas esticadas à frente, incline o tronco com as costas retas e alcance os pés.'),
    (12, 'Pernas', 'Quadríceps em pé', 30, null, 'Segure o pé atrás, puxando o calcanhar em direção ao glúteo. 20 a 30 s de cada lado.'),
    (13, 'Pernas', 'Panturrilha na parede', 30, null, 'Apoie as mãos na parede e leve um pé para trás, com o calcanhar no chão. 30 s de cada lado.'),
    (14, 'Pernas', 'Afastamento lateral sentada (sapo ou V)', 30, null, 'Pernas abertas, incline o tronco à frente, sem forçar.');

  insert into stretches (user_id, name, body_area, duration_seconds, reps, notes)
  select v_user, s.name, s.area, s.secs, s.reps, s.notes
  from _seed s
  where not exists (select 1 from stretches x where x.user_id = v_user and x.name = s.name);

  select id into v_routine from routines where user_id = v_user and name = 'Alongamento completo';
  if v_routine is null then
    insert into routines (user_id, name, position)
    values (v_user, 'Alongamento completo', (select count(*) from routines where user_id = v_user))
    returning id into v_routine;
  end if;

  insert into routine_stretches (user_id, routine_id, stretch_id, position)
  select v_user, v_routine, st.id, s.pos
  from _seed s
  join stretches st on st.user_id = v_user and st.name = s.name
  on conflict (routine_id, stretch_id) do nothing;
end $$;
