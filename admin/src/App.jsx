import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppShell from './components/AppShell.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Articles from './pages/Articles.jsx'
import ArticleEditor from './pages/ArticleEditor.jsx'
import Media from './pages/Media.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/articulos" element={<Articles />} />
          <Route path="/articulos/nuevo" element={<ArticleEditor />} />
          <Route path="/articulos/:id" element={<ArticleEditor />} />
          <Route path="/medios" element={<Media />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
