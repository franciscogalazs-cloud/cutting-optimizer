// Helpers para rutas respetando el base de Vite (GitHub Pages)
export function withBase(pathname = "") {
  // Tomar BASE_URL de Vite o del global inyectado en index.html
  const injected = (typeof window !== 'undefined' && (window).__BASE_URL__) || undefined;
  const base = (injected ?? import.meta?.env?.BASE_URL ?? "/");
  const clean = String(pathname).replace(/^\//, "");
  return `${base}${clean}`;
}

export function brandUrl(rel = "") {
  // rel: e.g., "brand/industrial-plate/stencil_main.svg"
  const relClean = cleanRel(rel);
  // En desarrollo, servir desde la raíz del dev server suele ser más fiable
  // (Vite puede montar bajo base, pero los archivos de public/ siguen accesibles en raíz)
  if (import.meta?.env?.DEV) {
    return `/${relClean}`;
  }
  // En build/producción, devolver URL absoluta con base para robustez (Pages)
  const withB = withBase(relClean);
  try {
    return new URL(withB, window.location.origin).href;
  } catch {
    return withB;
  }
}

// Dev helper: obtener la ruta relativa limpia (sin slash inicial)
export function cleanRel(rel = "") {
  return String(rel).replace(/^\/+/, "");
}

// Fallback absoluto a la raíz del host (útil en dev si el base no aplica a /public)
export function rootUrl(rel = "") {
  return `/${cleanRel(rel)}`;
}

export function absoluteUrl(rel = "") {
  const url = withBase(rel);
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}
