import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { deleteArticle, listArticles } from '../lib/articles.js'

function formatDate(iso) {
  return new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function Articles() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listArticles()
      .then((next) => {
        if (active) setItems(next)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    )
  }, [items, query])

  async function handleDelete(id, title) {
    if (!window.confirm(`¿Eliminar «${title}»?`)) return
    try {
      await deleteArticle(id)
      setItems(await listArticles())
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-carmesi">
            Archivo
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-carmesi-oscuro">
            Artículos
          </h1>
        </div>
        <Link
          to="/articulos/nuevo"
          className="inline-flex items-center gap-2 bg-carmesi px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-carmesi-oscuro"
        >
          <Plus size={16} />
          Nuevo
        </Link>
      </div>

      {error ? (
        <p className="border border-sello/30 bg-sello/5 px-3 py-2 text-sm text-sello">
          {error}
        </p>
      ) : null}

      <div className="relative max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
        />
        <input
          type="search"
          placeholder="Buscar por título o sala…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-paper-line bg-paper py-2.5 pl-9 pr-3 text-sm outline-none focus:border-carmesi"
        />
      </div>

      <div className="overflow-hidden border border-paper-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-paper-line bg-paper-dark text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Sala</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                Actualizado
              </th>
              <th className="px-4 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-soft">
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-soft">
                  No hay artículos que coincidan.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-paper-dark/80">
                  <td className="max-w-[280px] px-4 py-3">
                    <p className="truncate font-medium text-ink">{item.title}</p>
                    <p className="truncate text-xs text-ink-soft">{item.excerpt}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">
                    {item.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        item.status === 'published'
                          ? 'bg-azul/10 text-azul-oscuro'
                          : 'bg-oro/20 text-arcilla'
                      }`}
                    >
                      {item.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-soft md:table-cell">
                    {formatDate(item.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/articulos/${item.id}`}
                        className="rounded-md p-2 text-ink-soft hover:bg-stone/50 hover:text-carmesi"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="rounded-md p-2 text-ink-soft hover:bg-sello/10 hover:text-sello"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
