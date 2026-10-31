import { expect, test } from '@playwright/test'

const apiURL = 'http://127.0.0.1:8080'

function sampleArticle(overrides: Record<string, string> = {}) {
  return {
    title: `E2E artículo ${Date.now()}`,
    excerpt: 'Resumen de prueba automatizada',
    content: 'Texto de prueba del artículo para el museo.',
    category: 'Casa',
    status: 'draft',
    cover: '',
    image2: '',
    ...overrides,
  }
}

test('API: crea, publica, consulta y elimina un artículo', async ({ request }) => {
  const createdInput = sampleArticle()
  const createdResponse = await request.post(`${apiURL}/api/admin/articles`, {
    data: createdInput,
  })
  expect(createdResponse.status()).toBe(201)

  const created = await createdResponse.json()
  expect(created.id).toBeTruthy()
  expect(created.title).toBe(createdInput.title)

  try {
    const draftResponse = await request.get(`${apiURL}/api/articles/${created.id}`)
    expect(draftResponse.status()).toBe(404)

    const publishResponse = await request.put(
      `${apiURL}/api/admin/articles/${created.id}`,
      { data: { ...createdInput, status: 'published', image2: 'data:image/png;base64,dGVzdA==' } },
    )
    expect(publishResponse.ok()).toBeTruthy()
    const published = await publishResponse.json()
    expect(published.image2).toBe('data:image/png;base64,dGVzdA==')

    const publicResponse = await request.get(`${apiURL}/api/articles/${created.id}`)
    expect(publicResponse.ok()).toBeTruthy()
    expect((await publicResponse.json()).status).toBe('published')

    const publicList = await request.get(`${apiURL}/api/articles`)
    expect((await publicList.json()).some((item: { id: string }) => item.id === created.id)).toBeTruthy()
  } finally {
    const deleteResponse = await request.delete(`${apiURL}/api/admin/articles/${created.id}`)
    expect(deleteResponse.status()).toBe(204)
  }
})

test('API: rechaza campos inválidos y limita el listado público a publicados', async ({ request }) => {
  const invalidCategory = await request.post(`${apiURL}/api/admin/articles`, {
    data: sampleArticle({ category: 'No existe' }),
  })
  expect(invalidCategory.status()).toBe(400)

  const invalidStatus = await request.post(`${apiURL}/api/admin/articles`, {
    data: sampleArticle({ status: 'scheduled' }),
  })
  expect(invalidStatus.status()).toBe(400)

  const publicList = await request.get(`${apiURL}/api/articles`)
  expect(publicList.ok()).toBeTruthy()
  expect((await publicList.json()).every((item: { status: string }) => item.status === 'published')).toBeTruthy()
})

test('admin: inicia sesión, carga el archivo y sube artículo con dos imágenes', async ({ page }) => {
  const title = `E2E panel ${Date.now()}`
  let createdID: string | undefined

  try {
    await page.goto('/login')
    await page.getByLabel('Correo').fill('admin@casazamora.ve')
    await page.getByLabel('Clave').fill('zamora2026')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/$/)
    await page.goto('/articulos')
    await expect(page.getByRole('heading', { name: 'Artículos' })).toBeVisible()

    await page.getByRole('link', { name: 'Nuevo' }).click()
    await page.getByRole('textbox').nth(0).fill(title)
    await page.getByLabel('Resumen').fill('Resumen E2E del panel')
    await page.getByLabel('Cuerpo').fill('Contenido completo de prueba para el artículo del museo.')

    const image = {
      name: 'prueba.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p3sAAAAASUVORK5CYII=',
        'base64',
      ),
    }
    const imageInputs = page.locator('input[type="file"]')
    await imageInputs.nth(0).setInputFiles(image)
    await imageInputs.nth(1).setInputFiles({ ...image, name: 'prueba-2.png' })
    await expect(page.locator('img[src^="data:image/png;base64,"]')).toHaveCount(2)

    const createResponse = page.waitForResponse(
      (response) => response.url().includes('/api/admin/articles') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Guardar' }).click()
    const response = await createResponse
    expect(response.status()).toBe(201)
    createdID = (await response.json()).id

    await expect(page).toHaveURL(/\/articulos$/)
    await page.getByPlaceholder('Buscar por título o sala…').fill(title)
    await expect(page.getByText(title)).toBeVisible()

    const savedResponse = await page.request.get(`${apiURL}/api/admin/articles/${createdID}`)
    const saved = await savedResponse.json()
    expect(saved.cover).toMatch(/^data:image\/png;base64,/)
    expect(saved.image2).toMatch(/^data:image\/png;base64,/)
  } finally {
    if (createdID) {
      await page.request.delete(`${apiURL}/api/admin/articles/${createdID}`)
    }
  }
})

test('sitio principal: busca y muestra el texto y las dos imágenes del artículo publicado', async ({ page, request }) => {
  const image = 'data:image/png;base64,dGVzdA=='
  const input = sampleArticle({
    title: `E2E sitio público ${Date.now()}`,
    excerpt: 'Resumen visible para visitantes',
    content: 'Primer párrafo del artículo.\n\nSegundo párrafo del artículo.',
    status: 'published',
    cover: image,
    image2: image,
  })
  const createResponse = await request.post(`${apiURL}/api/admin/articles`, { data: input })
  expect(createResponse.status()).toBe(201)
  const created = await createResponse.json()

  try {
    const archiveResponse = await request.get(`${apiURL}/api/articles`)
    const archive = await archiveResponse.json()
    const summary = archive.find((item: { id: string }) => item.id === created.id)
    expect(summary).toBeTruthy()
    expect(summary.cover).toBe('')
    expect(summary.image2).toBe('')

    await page.goto(`${apiURL}/`)
    await expect(page.getByRole('heading', { name: 'Historias de la Casa-Pulpería' })).toBeVisible()
    await page.getByPlaceholder('Ej.: Zamora, Casa, cronología').fill(created.title)
    await expect(page.getByRole('heading', { name: created.title })).toBeVisible()
    await page.getByRole('button', { name: 'Leer artículo' }).click()
    await expect(page.getByText('Primer párrafo del artículo.', { exact: false })).toBeVisible()
    await expect(page.locator('.archive-article-images img')).toHaveCount(2)
  } finally {
    await request.delete(`${apiURL}/api/admin/articles/${created.id}`)
  }
})
