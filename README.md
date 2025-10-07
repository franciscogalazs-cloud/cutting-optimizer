# Cutting Optimizer – Guía completa

Optimización de cortes 2D para tableros de melamina, construida con React 18 + Vite 6 y Tailwind CSS v4. Enfocada en UX simple, cálculo determinista y reportes imprimibles.

## Requisitos
- Node.js 18+ (recomendado 20 o 22)
- pnpm (recomendado) o npm

Sugerido en Windows PowerShell: usar pnpm y scripts preparados para liberar puertos.

## Instalación

- Con pnpm (recomendado):
  - PowerShell: `pnpm install`

- Con npm:
  - PowerShell: `cmd /c npm install`

## Desarrollo

Opciones para levantar el entorno:

- pnpm (recomendado):
  - Arranque limpio liberando puertos comunes: `pnpm run dev:cleanstart`
  - Arranque normal: `pnpm run dev`

- npm:
  - PowerShell: `cmd /c npm run dev`
  - Alternativa con Node 20+: `node --run dev`

Por defecto Vite abre en http://localhost:5173 (ver consola para confirmar).

Nota PowerShell: si ves restricciones de ejecución con npm, anteponer `cmd /c` suele resolverlo.

## Scripts útiles

- `dev` – Servidor de desarrollo Vite
- `dev:freeports` – Libera puertos 5173–5175 en Windows PowerShell
- `dev:cleanstart` – Libera puertos y lanza `dev`
- `build` – Aplica branding y ejecuta `vite build`
- `preview` – Sirve el build en local
- `start` – Alias de preview con host/puerto fijo
- `lint` – Lint del proyecto
- `lint:fix` – Lint con auto-fix
- `brand:apply` – Aplica branding a assets/SVG
- `favicons` – Genera favicons PNG desde SVG

Ejemplos en PowerShell:

```powershell
# Desarrollo
pnpm run dev:cleanstart

# Compilar
pnpm run build

# Previsualizar build
pnpm run preview

# Lint
pnpm run lint
```

Alternativas npm (PowerShell):

```powershell
cmd /c npm run dev
cmd /c npm run build
cmd /c npm run preview
cmd /c npm run lint
```

## Características principales

- Optimización 2D con múltiples algoritmos: Guillotine (predeterminado en UI), Best Fit Decreasing (fallback), MaxRects, Backtracking y un híbrido experimental.
- Visualización de patrones con colores deterministas por pieza/material.
- Formularios simples para Piezas y Materiales, con unidades configurables (mm/cm).
- Presupuesto imprimible: muestra solo ítems usados, totales con Valor neto + IVA 19% + Total, y detalles de Empresa/Cliente (incluye RUT y Dirección).
- Persistencia local automática (localStorage) y sincronización entre pestañas.
- Branding listo para GitHub Pages (base path) y logos con filtros adecuados para impresión.

## Arquitectura y flujo

- UI principal en `src/App.jsx`: tabs, formularios, tablas, visualización y presupuesto.
- Algoritmos en `src/algorithms/*` exponen `optimize(pieces, materials)` y devuelven `{ patterns, totalUtilization, totalWaste, totalCost, materialsUsed, algorithm }`.
- Visualización de patrones en `src/components/visualization/AdvancedCuttingPattern.jsx`.
- Reportes/impresión: `src/lib/report.js`, `src/lib/report-html.js` y `src/lib/print.js`.
- Estado/persistencia: `src/hooks/useLocalStorage.js` y `src/hooks/useOptimization.js`.
- Theming claro en `src/theme/ThemeProvider.jsx` más utilidades en `src/theme/*`.

## Modelo de datos (contrato mínimo)

- Pieza: `{ id, label, length, width, quantity, material?, canRotate?, edges? }` (mm o cm según UI)
- Material: `{ id, material, length, width, quantity, price?, kerf?, margin? }`
- Resultado: cada `pattern` incluye `materialId, materialLength, materialWidth, pieces[{ x, y, width, height, rotated, label, color, edges }], utilization/waste`.

Helpers clave: `normalizePiece()` y factories en `src/types/` (`createCuttingPattern`, `createPlacedPiece`).

## Cómo usar (rápido)

1) En la pestaña Inicio, ingresa Piezas y Materiales. Puedes alternar mm/cm.
2) Ejecuta la optimización (el hook selecciona el algoritmo según configuración; la UI usa Guillotine por defecto).
3) Revisa los patrones en Visualización.
4) En Presupuesto, edita precios y cantidades cuando aplique:
   - Materiales base y Tapacantos se rellenan desde los cálculos y muestran solo lo usado.
   - Herrajes y Varios son editables, incluso si comienzan en 0 (se proveen filas de ejemplo). 
5) Imprime o exporta desde Presupuesto (se abre el diálogo de impresión del navegador).

Nota: en impresión se filtran automáticamente ítems con cantidad = 0.

## Linting

```powershell
pnpm run lint
```

Configuración relevante:
- Ignora `dist/` y `node_modules/`.
- Permite argumentos no usados con prefijo `_`.

## Build de producción

```powershell
pnpm run build
```

Para previsualizar:

```powershell
pnpm run preview
```

`build` ejecuta primero `tools/brand-build.mjs` para aplicar textos/logos a SVGs antes del `vite build`.

## Branding y assets

- Generación de favicons PNG desde SVG: `pnpm run favicons` (ver `tools/gen-favicons.mjs`).
- Helpers de rutas respetan `vite.base`: ver `src/lib/paths.js` (`brandUrl`, `absoluteUrl`).
- En impresión se fuerza logo negro mediante filtros CSS para mayor contraste.

## Despliegue (GitHub Pages)

- `vite.config.js` define `base: '/cutting-optimizer/'`.
- Los reportes usan rutas absolutas compatibles con el base.
- React 18.3.x para compatibilidad en producción.

## Notas y decisiones de UX

- Tabs y headers compactos; botones activos en gris pálido.
- Auto-scroll al entrar a Materiales centra “Materiales disponibles”; desactivado para Tapacantos.
- Presupuesto imprime solo ítems usados y calcula IVA 19% automáticamente.
- El modo oscuro está deshabilitado; tema claro consistente.

## Problemas conocidos y troubleshooting

- Puertos ocupados (5173–5175) en Windows: `pnpm run dev:freeports` o usa `dev:cleanstart`.
- PowerShell bloquea scripts npm: anteponer `cmd /c` a los comandos npm.
- Página en blanco tras publicar en GitHub Pages: verifica que el `base` coincida con la ruta del repo y usa los helpers de rutas.
- Datos inconsistentes tras cambios: limpia `localStorage` del dominio para restablecer el estado.
- Aviso de lint por dependencias en `useMemo`: es benigno; se puede ajustar si se requiere.

## Estructura rápida

- `src/algorithms/` – Guillotine, Best Fit Decreasing, MaxRects, Backtracking, Hybrid.
- `src/components/` – UI (formularios, tablas, modales, visualización, presupuesto).
- `src/hooks/` – Estado y persistencia local.
- `src/lib/` – Formato, paths, reporte/impresión y utilidades.
- `src/types/` – Tipos/factories del dominio.
- `theme/` y `styles/` – Tokens y estilos base.

## Contribuciones

Bienvenidas PRs pequeñas y enfocadas. Mantén el estilo del proyecto, evita introducir dependencias pesadas y valida con `pnpm run lint && pnpm run build` antes de abrir PR.


