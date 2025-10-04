# Guía rápida para agentes de IA en este repo

Proyecto: React 18 + Vite + Tailwind v4 para optimización 2D de cortes de melamina. Enfócate en UX simple, cálculo determinista y reportes imprimibles.

## Arquitectura y flujo de datos
- Entrada de dominio: `pieces[]` y `materials[]` (ver `src/types/` y formularios en `src/components/forms`). Unidades configurables: `mm|cm`.
- Orquestación UI: `src/App.jsx` maneja tabs, formularios, tablas y visualizaciones. Usa `useLocalStorage` para persistir y `useOptimization` para correr algoritmos.
- Algoritmos: `src/algorithms/*` exponen clases con `optimize(pieces, materials)` y devuelven `{ patterns, totalUtilization, totalWaste, totalCost, materialsUsed, algorithm }`. Predeterminado: Guillotine en UI, fallback BFD en hook.
- Visualización: `src/components/visualization/AdvancedCuttingPattern.jsx` dibuja patrones; reporte HTML en `src/lib/report*.js` + `print.js` para impresión en iframe.
- Theming: `src/theme/ThemeProvider.jsx` fuerza tema claro (no dark mode). Componentes UI se basan en Radix UI + Tailwind.
- Branding/assets: helpers en `src/lib/paths.js` (p. ej. `brandUrl`, `absoluteUrl`) respetan `vite.base` (GitHub Pages).

## Flujo de optimización (contrato mínimo)
- Piezas: `{ id, label, length, width, quantity, material?, canRotate?, edges? }` (length/width en unidades UI). `normalizePiece()` y conversión en `src/types/pieces.js`.
- Materiales: `{ id, material, length, width, quantity, price?, kerf?, margin? }`.
- Resultado esperado por UI/reportes: cada `pattern` incluye `materialId, materialLength, materialWidth, pieces[{x,y,width,height,rotated,label,color,edges}]` y `waste|utilization` calculados.

## Comandos y desarrollador cotidiano
- Dev: `npm run dev` (o en PowerShell: `cmd /c npm run dev`).
- Build: `npm run build` (ejecuta `tools/brand-build.mjs` antes de `vite build`). Preview: `npm run preview`.
- Lint: `npm run lint` (reglas en `eslint.config.js`; ignora `src/ai/**`). `argsIgnorePattern: '^_'` y permite vars en MAYÚSCULAS sin uso.
- Alias: `@` apunta a `src/` (ver `vite.config.js`). Usa rutas absolutas como `@/lib/format`.

## Convenciones del proyecto
- StrictMode: Solo en producción. En dev se usa `<Fragment>` por bugs con Portals de Radix; ver `src/main.jsx`.
- Unidades: UI permite alternar mm/cm; `App.jsx` sincroniza piezas/materiales y `config` al cambiar unidades. Evita introducir otra fuente de verdad.
- Persistencia local: usa `useLocalStorage(key, initial)`; escucha `storage` para sync entre pestañas.
- Costos/estats: algoritmos asignan `pattern.cost` desde `material.price` si existe y acumulan `totalCost`.
- Colores de piezas: deterministas por etiqueta/material (ver `PIECE_COLORS` y mapa en BFD).
- Separación y kerf: respeta `pattern.kerf` y `config.separation`; márgenes por material o `config.margin`.

## Puntos de integración
- Reportes: `src/lib/report.js` y `report-html.js` generan HTML autocontenido con SVG de patrones, métricas en m² (helpers `areaToSquareMeters`, `formatSquareMeters`). Impresión con `printElement()`.
- Branding: `tools/brand-build.mjs` sustituye textos en SVGs; `tools/gen-favicons.mjs` genera favicons PNG desde un SVG.
- AI (opcional): hooks en `src/hooks/useAI.js` consumen `src/ai/*`. El lint ignora `src/ai/**` y el proyecto funciona sin esa carpeta.

## Ejemplos útiles
- Crear patrón: usa `createCuttingPattern` y `createPlacedPiece` de `src/types/index.js` para mantener compatibilidad con visualización y reporte.
- Selección de algoritmo: en `useOptimization`, `config.algorithm` acepta `'guillotine'|'bfd'|'maxrects'|'backtracking'`. Cualquier nuevo algoritmo debe implementar `.optimize(...)` con el mismo shape de retorno.
- Rutas de marca en dev/prod: usa `brandUrl('brand/industrial-plate/stencil_main.svg')`; en dev, `Header` hace fallback a `rootUrl` si falla.

## Errores y edge-cases conocidos
- Portals Radix en dev: no uses StrictMode; ya gestionado en `main.jsx`.
- Datos incompletos: normaliza piezas con `normalizePiece()` y valida `Number.isFinite` antes de cálculos; la UI hace defensas similares.
- Base URL: en dev `base: '/'`, en build `'/cutting-optimizer/'`. Usa `absoluteUrl()` para assets en reportes.

Si algo no está claro (p. ej., campos exactos en `types/` o nuevas métricas), dime qué falta y lo completamos en esta guía.
