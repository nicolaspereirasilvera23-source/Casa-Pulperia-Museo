# API local

El API usa SQLite para guardar el archivo de artículos en desarrollo.

```powershell
cd api
go run .
```

La primera ejecución crea `api/data/articulos.db` y carga dos artículos de demostración si la tabla está vacía. El archivo de base de datos está excluido de Git. Se puede cambiar la ubicación con `SQLITE_PATH` en el entorno.

Desde `admin/` se pueden buscar artículos por título o sala, crear y editar borradores, publicar y eliminar artículos. Cada artículo admite título, resumen, texto, categoría, estado y dos imágenes.
