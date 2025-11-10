## v0.1.0 – limpieza de IA, nuevos scripts y tareas VS Code

Esta versión se centra en limpieza del repositorio y mejoras de DX (developer experience).

### Cambios principales

- Limpieza: se eliminaron módulos y componentes de IA no usados (`src/ai/**` y `src/components/ai/**`), junto con archivos temporales/patches en la raíz del proyecto.
- Removido `src/components/visualization/SummarySheet.tsx` (migrado a `.jsx`).
- Nuevos scripts en `package.json`:
  - `clean`: elimina dist, caches y artefactos temporales.
  - `clean:cache`: limpia únicamente caches locales.
  - `preview:local`: sirve el build en http://localhost:4173.
- Nuevas tareas de VS Code en `.vscode/tasks.json`:
  - `clean`, `clean:cache`, `preview:local`.
- `.gitignore` actualizado para ignorar caches de ESLint y artefactos.
- Lint/Build verificados en verde.

### Cómo probar

1. Instalar dependencias
   - PowerShell:
     - pnpm install
2. Compilar y previsualizar
   - pnpm run build
   - pnpm run preview:local  # abre en http://localhost:4173
   - Alternativa: pnpm run preview

### Notas

- El modo oscuro sigue deshabilitado; tema claro consistente.
- Los helpers de rutas (`brandUrl`, `absoluteUrl`) respetan el base path para GitHub Pages.
