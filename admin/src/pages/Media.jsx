import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { listArticles } from '../lib/articles.js'

export default function Media() {
  const [covers, setCovers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listArticles()
      .then((items) => {
        if (active) setCovers(items.filter((item) => item.cover || item.image2))
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-carmesi">
          Archivo visual
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-carmesi-oscuro">
          Medios
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Portadas asociadas a los artículos. Suba imágenes al crear o editar
          una pieza.
        </p>
      </div>

      {error ? (
        <p className="border border-sello/30 bg-sello/5 px-3 py-2 text-sm text-sello">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : covers.length === 0 ? (
        <div className="flex flex-col items-center border border-dashed border-paper-line bg-paper px-6 py-16 text-center">
          <ImageOff className="mb-3 text-ink-soft" size={28} />
          <p className="text-sm text-ink-soft">
            Todavía no hay imágenes en el archivo.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {covers.flatMap((item) => [
            item.cover && { key: `${item.id}-cover`, src: item.cover, label: 'Portada' },
            item.image2 && { key: `${item.id}-image2`, src: item.image2, label: 'Imagen 2' },
          ].filter(Boolean).map((image) => (
            <li key={image.key} className="border border-paper-line bg-paper">
              <img src={image.src} alt="" className="h-44 w-full object-cover" />
              <p className="truncate px-3 py-3 text-sm font-medium">{item.title} · {image.label}</p>
            </li>
          )))}
        </ul>
      )}
    </div>
  )
}
