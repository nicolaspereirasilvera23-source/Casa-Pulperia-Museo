import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getArticle, saveArticle } from '../lib/articles.js'

const empty = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Casa',
  status: 'draft',
  cover: '',
}

const categories = ['Casa', 'Salas', 'Patio', 'Cronología', 'Visita']

export default function ArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [form, setForm] = useState(empty)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!id) {
      setForm(empty)
      return
    }
    const found = getArticle(id)
    if (!found) {
      setMissing(true)
      return
    }
    setForm(found)
  }, [id])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCover(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('cover', String(reader.result))
    reader.readAsDataURL(file)
  }

  function handleSubmit(event) {
    event.preventDefault()
    saveArticle(form)
    navigate('/articulos')
  }

  if (missing) {
    return (
      <div className="mx-auto max-w-xl border border-paper-line bg-paper p-8 text-center">
        <p className="text-ink">No se encontró ese artículo.</p>
        <Link to="/articulos" className="mt-4 inline-block text-sm text-carmesi">
          Volver al archivo
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-carmesi">
          {isNew ? 'Nuevo' : 'Editar'}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-carmesi-oscuro">
          {isNew ? 'Subir artículo' : 'Editar artículo'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 border border-paper-line bg-paper p-6"
      >
        <label className="block text-sm">
          <span className="mb-1.5 block text-ink-soft">Título</span>
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full border border-paper-line bg-paper-dark px-3 py-2.5 outline-none focus:border-carmesi"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block text-ink-soft">Sala / categoría</span>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full border border-paper-line bg-paper-dark px-3 py-2.5 outline-none focus:border-carmesi"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-ink-soft">Estado</span>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full border border-paper-line bg-paper-dark px-3 py-2.5 outline-none focus:border-carmesi"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block text-ink-soft">Resumen</span>
          <textarea
            rows={2}
            value={form.excerpt}
            onChange={(e) => update('excerpt', e.target.value)}
            className="w-full resize-y border border-paper-line bg-paper-dark px-3 py-2.5 outline-none focus:border-carmesi"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-ink-soft">Cuerpo</span>
          <textarea
            rows={10}
            required
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
            className="w-full resize-y border border-paper-line bg-paper-dark px-3 py-2.5 outline-none focus:border-carmesi"
          />
        </label>

        <div className="text-sm">
          <span className="mb-1.5 block text-ink-soft">Imagen de portada</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleCover}
            className="block w-full text-sm text-ink-soft file:mr-3 file:border-0 file:bg-carmesi file:px-3 file:py-2 file:text-sm file:font-semibold file:uppercase file:tracking-wide file:text-white hover:file:bg-carmesi-oscuro"
          />
          {form.cover ? (
            <img
              src={form.cover}
              alt=""
              className="mt-3 max-h-48 w-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            className="bg-carmesi px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-carmesi-oscuro"
          >
            Guardar
          </button>
          <Link
            to="/articulos"
            className="border border-paper-line px-5 py-2.5 text-sm text-ink-soft hover:border-ink"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
