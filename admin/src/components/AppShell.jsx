import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/articulos', label: 'Artículos', icon: FileText },
  { to: '/medios', label: 'Medios', icon: Image },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-svh bg-paper-dark text-ink">
      <div className="flex min-h-svh">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-paper-line bg-paper transition-transform duration-200 lg:static lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center gap-3 border-b border-paper-line px-5">
            <img src="/logo-zamora.png" alt="" className="h-10 w-auto" />
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-wider text-carmesi-oscuro">
                Casa-Pulpería
              </p>
              <p className="text-xs text-ink-soft">Panel de gestión</p>
            </div>
            <button
              type="button"
              className="ml-auto rounded-md p-1 text-ink-soft lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-carmesi text-white'
                      : 'text-ink-soft hover:bg-stone/50 hover:text-ink'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-paper-line bg-paper/95 px-4 backdrop-blur">
            <button
              type="button"
              className="rounded-md p-2 text-ink-soft hover:bg-stone/40 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <p className="hidden text-sm text-ink-soft sm:block">
              Museo · Villa de Cura, Aragua
            </p>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-ink">{user?.name}</p>
                <p className="text-xs text-ink-soft">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-md border border-paper-line px-3 py-2 text-sm text-ink-soft hover:border-carmesi hover:text-carmesi"
              >
                <LogOut size={16} />
                Salir
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
