# Cutting Optimizer – Guía de arranque rápido

Proyecto React + Vite con Tailwind CSS v4 para optimización de cortes 2D de melamina.

## Requisitos
- Node.js 18+ (recomendado 20/22)
- npm (o pnpm si lo prefieres)

## Instalación

Si los paquetes no están instalados:

```
npm install
```

## Desarrollo

En algunas instalaciones de PowerShell, `npm` puede estar bloqueado por la política de ejecución. Tienes varias opciones:

- PowerShell:
  - `cmd /c npm run dev`
  - o `node --run dev` (Node 20+)
- CMD clásico:
  - `npm run dev`

Vite levantará el servidor en la URL que muestre la consola (por defecto, http://localhost:5173).

## Build de producción

```
cmd /c npm run build
```

Para previsualizar el build localmente:

```
cmd /c npm run preview
```

## Linting

```
cmd /c npm run lint
```

Notas de lint configuradas:
- Se ignoran `dist/`, `cutting-optimizer-dist/` y `node_modules/`.
- Se permiten argumentos no usados que empiecen por `_`.

## Cambios clave realizados
- `src/main.jsx`: ahora importa `./App.css` para que Tailwind y los estilos base se apliquen correctamente.
- `vite.config.js`: compatibilidad ESM añadiendo `__dirname` vía `fileURLToPath`.
- `eslint.config.js`: añadidas rutas a ignorar y tolerancia de argumentos con prefijo `_`.
- Pequeñas limpiezas de variables no usadas en `src/App.jsx`, `src/components/visualization/AdvancedCuttingPattern.jsx` y `src/components/common/ExportModal.jsx` para que el lint quede limpio.

## Mantenimiento y limpieza reciente
- Eliminados componentes obsoletos/no referenciados:
  - `src/components/visualization/CuttingPattern.jsx`
  - `src/components/visualization/StatsPanel.jsx`
  - `src/components/LogoPlate.tsx`
  - Stub descontinuado: `src/components/visualization/SummarySheet.tsx`
- Eliminados artefactos temporales en la raíz del proyecto:
  - `app.patch`, `app_clean.patch`, `codex-checkpoint.patch`, `codex-checkpoint-utf8.patch`, `tmp_App_from_git.txt`
- Se verificó con `lint` y `build` que no existan referencias rotas tras la limpieza.

### Poda de dependencias (2025-10-03)
- Removidas por no uso: `react-router-dom`, `react-resizable-panels`, `framer-motion`, `recharts`, `embla-carousel-react`, `date-fns`, `react-day-picker`, `next-themes`, `vaul`.
- Mantengo `sonner` para toasts y Radix UI como base de componentes.

## Estructura breve
- `src/algorithms/` – Algoritmos de optimización (Best Fit Decreasing).
- `src/components/` – UI (formularios, tablas, visualización de patrones).
- `src/hooks/` – Hooks de estado y almacenamiento.
- `src/types/` – Factories y constantes del dominio.

## Siguientes pasos sugeridos
- Probar con piezas/materiales de ejemplo y validar patrones generados.
- Añadir tests unitarios al algoritmo si se requiere.
- Exportaciones: ampliar a PDF real (por ahora se genera HTML descargable) o a SVG/PNG con mayor fidelidad.

## Notas de despliegue (GitHub Pages)
- Vite está configurado con `base: '/cutting-optimizer/'`.
- Los assets de marca utilizan helpers que respetan el base (`brandUrl()`).
- React fijado a 18.3.x para compatibilidad de librerías en producción.

