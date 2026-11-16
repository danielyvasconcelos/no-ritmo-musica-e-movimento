import { NavLink, Outlet } from 'react-router-dom'
import { Icon } from './ui'
import { useSyncStatus } from '../hooks/useSyncStatus'

const tabs = [
  { to: '/', label: 'Hoje', icon: 'today' },
  { to: '/aulas', label: 'Aulas', icon: 'play' },
  { to: '/treinos', label: 'Treinos', icon: 'pulse' },
  { to: '/progresso', label: 'Progresso', icon: 'graph' },
  { to: '/perfil', label: 'Perfil', icon: 'person' },
] as const

export default function Layout() {
  const { pending, online } = useSyncStatus()
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-subtle/95 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-6 w-6 rounded" />
          <span className="font-semibold tracking-tight">NoRitmo</span>
        </div>
        {!online ? (
          <span className="chip border-attention/50 text-attention">Offline{pending ? ` · ${pending} a sincronizar` : ''}</span>
        ) : pending ? (
          <span className="chip text-accent">Sincronizando…</span>
        ) : null}
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-subtle/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map((t) => (
            <li key={t.to}>
              <NavLink
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                    isActive ? 'text-fg' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={t.icon} className={isActive ? 'text-accent' : ''} />
                    {t.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
