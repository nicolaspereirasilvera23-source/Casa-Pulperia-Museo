const ARTICLES_PATH = '/api/admin/articles'

async function readError(response) {
  try {
    const body = await response.json()
    if (body?.error) return body.error
  } catch {
    /* respuesta sin JSON */
  }
  return 'No se pudo completar la operación.'
}

async function request(path, options) {
  const response = await fetch(path, options)
  if (!response.ok) {
    const error = new Error(await readError(response))
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

export function listArticles() {
  return request(ARTICLES_PATH)
}

export function getArticle(id) {
  return request(`${ARTICLES_PATH}/${id}`)
}

export function saveArticle(payload) {
  const body = JSON.stringify({
    title: payload.title,
    excerpt: payload.excerpt,
    content: payload.content,
    category: payload.category,
    status: payload.status,
    cover: payload.cover,
    image2: payload.image2,
  })
  const headers = { 'Content-Type': 'application/json' }

  if (payload.id) {
    return request(`${ARTICLES_PATH}/${payload.id}`, {
      method: 'PUT',
      headers,
      body,
    })
  }

  return request(ARTICLES_PATH, { method: 'POST', headers, body })
}

export function deleteArticle(id) {
  return request(`${ARTICLES_PATH}/${id}`, { method: 'DELETE' })
}

export function summarizeArticles(items) {
  const published = items.filter((item) => item.status === 'published').length
  const drafts = items.filter((item) => item.status === 'draft').length
  const month = new Date().getMonth()
  const year = new Date().getFullYear()
  const thisMonth = items.filter((item) => {
    const created = new Date(item.createdAt)
    return created.getMonth() === month && created.getFullYear() === year
  }).length

  return {
    total: items.length,
    published,
    drafts,
    thisMonth,
    recent: [...items]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5),
  }
}
