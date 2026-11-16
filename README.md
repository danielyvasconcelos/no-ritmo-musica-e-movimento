# NoRitmo

PWA para dançarinos: alongar, treinar e dançar um pouco todo dia, com a constância visível.
React + TypeScript + Vite · Tailwind (tema GitHub dark) · Supabase · TanStack Query · vite-plugin-pwa.

## Rodando

1. Crie um projeto no [Supabase](https://supabase.com) e rode `supabase/schema.sql` no **SQL Editor**.
2. `cp .env.example .env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. (Opcional) em Authentication → Providers → Email, desative "Confirm email" para testar mais rápido.
4. `npm install` e `npm run dev`.

Build: `npm run build` · Publicação: Vercel/Netlify (HTTPS é obrigatório para PWA; defina as duas variáveis de ambiente
e, no Vercel/Netlify, um rewrite de qualquer rota para `/index.html`).

## Estrutura

- `src/pages` — Hoje, Timer, Aulas (lista/nova/detalhe), Treinos (lista/formulário), Progresso, Perfil
- `src/lib/api.ts` — consultas e mutações (TanStack Query + Supabase)
- `src/lib/offline.ts` — fila local (IndexedDB) para marcações e sessões feitas sem internet
- `src/lib/persist.ts` — cache das últimas leituras para abrir offline
- `src/lib/dates.ts` — "dia" no fuso do usuário, sequências

## Decisões

- Colunas extras em relação ao escopo: `stretches.reps` (duração **ou** repetições).
- A rotina escolhida para "hoje" fica no aparelho (localStorage); a ordem dos alongamentos vem de `routine_stretches.position`.
- Sequência atual: se hoje ainda está em branco, conta a partir de ontem (o app nunca pune).
- Offline: checks e sessões (criar/editar/excluir) funcionam sem internet; demais edições exigem conexão.
