import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  function handleSubmit(event) {
    event.preventDefault()
    const result = login(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-paper-dark px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(#6e042e 0.8px, transparent 0.8px)',
          backgroundSize: '18px 18px',
        }}
      />

      <div className="relative w-full max-w-md border border-paper-line bg-paper p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img
            src="/logo-zamora.png"
            alt="Casa-Pulpería Ezequiel Zamora"
            className="mx-auto mb-4 h-20 w-auto"
          />
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-carmesi">
            Acceso interno
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-carmesi-oscuro">
            Panel de gestión
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Ingrese con las credenciales de la casa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block text-ink-soft">Correo</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-paper-line bg-paper-dark px-3 py-2.5 outline-none focus:border-carmesi"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-ink-soft">Clave</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-paper-line bg-paper-dark px-3 py-2.5 outline-none focus:border-carmesi"
            />
          </label>

          {error ? (
            <p className="border border-sello/30 bg-sello/5 px-3 py-2 text-sm text-sello">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full bg-carmesi py-2.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-carmesi-oscuro"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 border-t border-paper-line pt-4 text-center text-xs text-ink-soft">
          Demostración: <span className="text-ink">admin@casazamora.ve</span> ·{' '}
          <span className="text-ink">zamora2026</span>
        </p>
      </div>
    </div>
  )
}
