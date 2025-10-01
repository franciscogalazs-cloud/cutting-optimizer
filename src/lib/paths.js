// Helpers para rutas respetando el base de Vite (GitHub Pages)
export function withBase(pathname = "") {
  const base = (import.meta?.env?.BASE_URL ?? "/");
  const clean = String(pathname).replace(/^\//, "");
  return `${base}${clean}`;
}

export function brandUrl(rel = "") {
  // rel: e.g., "brand/industrial-plate/stencil_main.svg"
  return withBase(rel);
}

export function absoluteUrl(rel = "") {
  const url = withBase(rel);
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}
