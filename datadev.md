# Data / Dev — Panel Casa-Pulpería Ezequiel Zamora

Documento de desarrollo: cómo arrancar el dashboard, credenciales de prueba, usos del panel y notas técnicas.

---

## Requisitos

- Node.js 20+ (recomendado)
- npm 10+
- Navegador moderno (Chrome, Firefox, Edge)

Opcional, cuando se conecte el backend:

- Go 1.22+
- Docker (MongoDB vía `api/docker-compose.yml`)

---

## Comandos de iniciación — Admin (React)

Desde la raíz del repositorio:

```bash
cd admin
npm install
npm run dev
```

Abrir en el navegador:

```
http://localhost:5173/
```

**Importante:** no abrir `admin/index.html` como archivo (`file://`). La pantalla quedará en blanco; Vite debe servir la app.

### Otros scripts

| Comando | Uso |
|--------|-----|
| `npm run dev` | Servidor de desarrollo (hot reload) en `:5173` |
| `npm run build` | Build de producción en `admin/dist` |
| `npm run preview` | Previsualizar el build local |
| `npm run lint` | Linter (oxlint) |

---

## Credenciales de prueba

| Campo | Valor |
|-------|--------|
| Correo | `admin@casazamora.ve` |
| Clave | `zamora2026` |
| Nombre en sesión | Administración |
| Rol | Editor |

La autenticación es **local / demo** (validación en el frontend). La sesión se guarda en `localStorage` bajo la clave `cz_session`.

> No usar estas credenciales en producción. Sustituir por auth real del API cuando exista.

---

## Usos del dashboard

### Resumen (`/`)

- Métricas rápidas: total de artículos, publicados, borradores, creados este mes.
- Actividad reciente (últimas ediciones).
- Acceso directo a «Subir artículo».

### Artículos (`/articulos`)

- Listar, buscar por título o sala/categoría.
- Crear (`/articulos/nuevo`), editar (`/articulos/:id`), eliminar.
- Campos: título, resumen, cuerpo, categoría (Casa, Salas, Patio, Cronología, Visita), estado (borrador / publicado), imagen de portada.

### Medios (`/medios`)

- Galería de portadas asociadas a artículos.
- Las imágenes se suben al crear o editar un artículo.

### Login / salida

- Login: `/login`
- Salir: botón «Salir» en la cabecera (limpia la sesión).

Rutas protegidas: sin sesión, cualquier ruta del panel redirige a `/login`.

---

## Datos de prueba (seed)

Si no hay artículos en el navegador, se cargan dos de ejemplo:

1. **Publicado** — «La pulpería del General del Pueblo Soberano» (categoría Casa)
2. **Borrador** — «Cronología federal: de la pulpería al museo» (categoría Cronología)

Almacenamiento: `localStorage` clave `cz_articles`.

### Resetear datos locales

En la consola del navegador (DevTools):

```js
localStorage.removeItem('cz_articles')
localStorage.removeItem('cz_session')
location.reload()
```

---

## Stack del panel

| Pieza | Tecnología |
|-------|------------|
| UI | React 19 |
| Build | Vite 8 |
| Estilos | Tailwind CSS 4 |
| Rutas | react-router-dom |
| Iconos | lucide-react |
| Puerto dev | `5173` |

Proxy Vite hacia el API Go (cuando existan endpoints):

```
/api  →  http://localhost:8080
```

Configurado en `admin/vite.config.js`.

---

## API Go (contexto)

El backend vive en `api/`. Arranque típico (cuando esté listo el servidor):

```bash
cd api
# variables: ver api/.env.example
docker compose up -d   # MongoDB
go run .
```

| Variable | Default (ejemplo) |
|----------|-------------------|
| `PORT` | `8080` |
| `MONGO_URI` | `mongodb://localhost:27017` |
| `MONGO_DB` | `articulos` |

Hasta que el API exponga login y CRUD de artículos, el panel opera solo con datos locales.

---

## Checklist rápido

1. `cd admin && npm install && npm run dev`
2. Abrir `http://localhost:5173/`
3. Entrar con `admin@casazamora.ve` / `zamora2026`
4. Revisar métricas, crear o editar un artículo, subir portada
5. (Opcional) Arrancar `api` y Mongo cuando se conecte el backend
