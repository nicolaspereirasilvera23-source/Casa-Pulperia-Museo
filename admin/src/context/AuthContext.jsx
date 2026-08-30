import { createContext, useContext, useMemo, useState } from 'react'

const SESSION_KEY = 'cz_session'

const DEMO = {
  email: 'admin@casazamora.ve',
  password: 'zamora2026',
  name: 'Administración',
  role: 'Editor',
}

const AuthContext = createContext(null)

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  const value = useMemo(
    () => ({
      user,
      login(email, password) {
        if (
          email.trim().toLowerCase() === DEMO.email &&
          password === DEMO.password
        ) {
          const session = { email: DEMO.email, name: DEMO.name, role: DEMO.role }
          localStorage.setItem(SESSION_KEY, JSON.stringify(session))
          setUser(session)
          return { ok: true }
        }
        return { ok: false, error: 'Correo o clave incorrectos.' }
      },
      logout() {
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
