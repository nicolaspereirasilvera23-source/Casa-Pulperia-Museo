import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePenLine, FileText, FolderPlus, Send } from 'lucide-react'
import { listArticles, summarizeArticles } from '../lib/articles.js'

function formatDate(iso) {
  return new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listArticles()
      .then((items) => {
        if (active) setStats(summarizeArticles(items))
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [])

  const cards = [
    {
      label: 'Artículos',
      value: stats?.total,
      hint: 'en el archivo',
      icon: FileText,
    },
    {
      label: 'Publicados',
      value: stats?.published,
      hint: 'visibles en el sitio',
      icon: Send,
    },
    {
      label: 'Borradores',
      value: stats?.drafts,
      hint: 'pendientes de revisión',
      icon: FilePenLine,
    },
    {
      label: 'Este mes',
      value: stats?.thisMonth,
      hint: 'nuevos registros',
      icon: FolderPlus,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-carmesi">
            Resumen
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-carmesi-oscuro">
            Métricas rápidas
          </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-soft">
              Estado del archivo editorial de la Casa-Pulpería.
            </p>
        </div>
        <Link
          to="/articulos/nuevo"
          className="bg-carmesi px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-carmesi-oscuro"
        >
          Subir artículo
        </Link>
      </div>

      {error ? (
        <p className="border border-sello/30 bg-sello/5 px-3 py-2 text-sm text-sello">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <article
            key={label}
            className="border border-paper-line bg-paper p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                {label}
              </p>
              <span className="rounded-full bg-stone/70 p-2 text-carmesi">
                <Icon size={16} />
              </span>
            </div>
            <p className="font-display text-4xl font-bold text-ink">
              {stats ? value : '—'}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{hint}</p>
          </article>
        ))}
      </section>

      <section className="border border-paper-line bg-paper">
        <div className="flex items-center justify-between border-b border-paper-line px-5 py-4">
          <h2 className="font-display text-lg font-bold uppercase text-carmesi-oscuro">
            Actividad reciente
          </h2>
          <Link
            to="/articulos"
            className="text-sm text-carmesi underline-offset-4 hover:underline"
          >
            Ver todos
          </Link>
        </div>
        {error ? null : !stats ? (
          <p className="px-5 py-8 text-sm text-ink-soft">Cargando…</p>
        ) : stats.recent.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink-soft">
            Aún no hay artículos. Suba el primero para comenzar el archivo.
          </p>
        ) : (
          <ul className="divide-y divide-paper-line">
            {stats.recent.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-ink-soft">
                    {item.category} · actualizado {formatDate(item.updatedAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    item.status === 'published'
                      ? 'bg-azul/10 text-azul-oscuro'
                      : 'bg-oro/20 text-arcilla'
                  }`}
                >
                  {item.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
