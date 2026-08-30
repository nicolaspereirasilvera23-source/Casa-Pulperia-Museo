const STORAGE_KEY = 'cz_articles'

const seed = [
  {
    id: 'a1',
    title: 'La pulpería del General del Pueblo Soberano',
    excerpt:
      'La antigua tienda de Ezequiel Zamora, reconstruida como museo y café cultural en Villa de Cura.',
    content:
      'La Casa-Pulpería abre sus salas para contar el pensamiento civil y la Guerra Federal. El recorrido une la casa, el patio y las piezas que guardan la memoria de Villa de Cura.',
    category: 'Casa',
    status: 'published',
    cover: '',
    createdAt: '2026-08-12T10:00:00.000Z',
    updatedAt: '2026-08-20T14:30:00.000Z',
  },
  {
    id: 'a2',
    title: 'Cronología federal: de la pulpería al museo',
    excerpt:
      'Hitos de la vida de Zamora y de la casa que hoy opera como espacio cultural.',
    content:
      'Borrador de la línea de tiempo para la sala de cronología. Pendiente de revisión de fechas y fuentes.',
    category: 'Cronología',
    status: 'draft',
    cover: '',
    createdAt: '2026-08-22T09:00:00.000Z',
    updatedAt: '2026-08-28T11:15:00.000Z',
  },
]

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return JSON.parse(raw)
  } catch {
    return [...seed]
  }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  return items
}

export function listArticles() {
  return readAll().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function getArticle(id) {
  return readAll().find((item) => item.id === id) ?? null
}

export function saveArticle(payload) {
  const items = readAll()
  const now = new Date().toISOString()

  if (payload.id) {
    const next = items.map((item) =>
      item.id === payload.id ? { ...item, ...payload, updatedAt: now } : item,
    )
    writeAll(next)
    return next.find((item) => item.id === payload.id)
  }

  const created = {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  writeAll([created, ...items])
  return created
}

export function deleteArticle(id) {
  writeAll(readAll().filter((item) => item.id !== id))
}

export function articleStats() {
  const items = readAll()
  const published = items.filter((item) => item.status === 'published').length
  const drafts = items.filter((item) => item.status === 'draft').length
  const month = new Date().getMonth()
  const year = new Date().getFullYear()
  const thisMonth = items.filter((item) => {
    const d = new Date(item.createdAt)
    return d.getMonth() === month && d.getFullYear() === year
  }).length

  return {
    total: items.length,
    published,
    drafts,
    thisMonth,
    recent: [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
  }
}
