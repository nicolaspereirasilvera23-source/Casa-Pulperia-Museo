# Coordinación y pruebas

## Uso de Concord

Este trabajo se coordinó con Concord, siguiendo [`.agents/rules/concord.md`](.agents/rules/concord.md):

1. `start_work` registra la tarea y declara los archivos o módulos antes de editarlos.
2. `inspect_work` consulta el estado de tareas, agentes, mensajes y traspasos.
3. `update_work` registra avances o envía preguntas y respuestas a otros agentes.
4. `transfer_work` permite entregar o aceptar una tarea.
5. `finish_work` guarda los archivos modificados, las pruebas, decisiones y resultado.

Concord avisa cuando otra tarea ya tiene un archivo reservado, para resolver el solapamiento antes de editar.

En este trabajo, Codex registró la implementación SQLite como `TASK-articulos-sqlite`. Antigravity tomó `TASK-test-e2e-articulos` como tarea hija, revisó la implementación y preparó el traspaso porque su entorno bloqueaba la ejecución del servidor Go. Codex aceptó el traspaso, completó Playwright y registró los resultados en Concord.

## Pruebas E2E con Playwright

La configuración está en [`admin/playwright.config.ts`](admin/playwright.config.ts), los casos en [`admin/tests/e2e/articles.spec.ts`](admin/tests/e2e/articles.spec.ts) y el comando `e2e` en `admin/package.json`.

Para ejecutar la suite:

```bash
cd admin
npm install
npx playwright install chromium
npm run e2e
```

Playwright inicia el API Go y Vite por su cuenta. Usa una base SQLite E2E separada en `api/data/articles-e2e.db`.

Los cuatro casos cubren:

1. Crear un borrador por API, comprobar que no sea público, publicarlo, consultarlo y eliminarlo.
2. Rechazar una categoría y un estado inválidos, y confirmar que el listado público solo contenga artículos publicados.
3. Iniciar sesión en el panel demo, crear un artículo con dos imágenes, buscarlo y comprobar que las imágenes persistan.
4. Buscar un artículo publicado en el sitio principal y abrirlo para comprobar el texto y las dos imágenes.

**Última ejecución:** `npm run e2e` — 4 pruebas aprobadas con Chromium. En Windows, la ejecución necesita permiso para abrir los servidores en `localhost:8080` y `localhost:5173`.
