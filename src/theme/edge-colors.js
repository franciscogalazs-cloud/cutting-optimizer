// Colores centralizados para tapacantos y utilidades de selección

export const EDGE_TYPE_COLORS = Object.freeze({
  General: '#2563eb', // blue-600
  Grueso: '#0f766e', // teal-700
  Delgado: '#dc2626', // red-600
  '0.45mm': '#7c3aed', // violet-600
  '1mm': '#065f46', // emerald-800
  '2mm': '#1d4ed8', // blue-700
});

// Paleta segura y diversa (evitar negro). Ordenada para buen contraste y variedad.
const SAFE_PALETTE = [
  '#2563eb', // blue-600
  '#0ea5e9', // sky-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#7c3aed', // violet-600
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#22c55e', // green-500
  '#a855f7', // violet-500
  '#84cc16', // lime-500
  '#e11d48', // rose-600
];

const hexToRgb = (hex = '') => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  const r = m[1].length === 1 ? parseInt(m[1] + m[1], 16) : parseInt(m[1], 16);
  const g = m[2].length === 1 ? parseInt(m[2] + m[2], 16) : parseInt(m[2], 16);
  const b = m[3].length === 1 ? parseInt(m[3] + m[3], 16) : parseInt(m[3], 16);
  return { r, g, b };
};

const luminance = ({ r, g, b }) => {
  const srgb = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const [R, G, B] = srgb;
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

const contrastRatio = (c1, c2) => {
  const L1 = luminance(hexToRgb(c1)) + 0.05;
  const L2 = luminance(hexToRgb(c2)) + 0.05;
  return L1 > L2 ? L1 / L2 : L2 / L1;
};

const isBlackish = (c) => {
  const s = String(c).trim().toLowerCase();
  if (s === 'black' || s === '#000' || s === '#000000') return true;
  if (s.startsWith('rgb(')) return /rgb\s*\(\s*0\s*,\s*0\s*,\s*0\s*\)/.test(s);
  return false;
};

// Hash simple y estable para strings (para indexar paleta por tipo)
const hashString = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const pickFromPaletteByType = (type = '') => {
  const idx = hashString(type) % SAFE_PALETTE.length;
  return SAFE_PALETTE[idx];
};

// Elegir color por contraste con el color base de la pieza (plancha)
const pickByBaseFill = (baseFill) => {
  const threshold = 3.0; // contraste mínimo recomendado para distinguirse perceptiblemente
  // Ordenar la paleta por mayor contraste primero para un picking estable
  const sorted = [...SAFE_PALETTE].sort((a, b) => contrastRatio(b, baseFill) - contrastRatio(a, baseFill));
  for (const c of sorted) {
    if (!isBlackish(c) && contrastRatio(c, baseFill) >= threshold) return c;
  }
  // Fallback: el de mayor contraste aunque no alcance el umbral
  return sorted[0] || '#2563eb';
};

/**
 * Devuelve un color para el tapacanto según el tipo seleccionado, evitando negro
 * y ajustando por contraste con el color base de la pieza si se provee.
 */
export const getEdgeColor = (type, index = 0, baseFill) => {
  // Política combinada:
  // 1) Determinar color base por tipo (consistencia entre vistas)
  // 2) Si hay color de pieza (plancha), ajustar para asegurar diferencia/contraste
  let color = type
    ? (EDGE_TYPE_COLORS[type] || pickFromPaletteByType(type))
    : (SAFE_PALETTE[index % SAFE_PALETTE.length] || '#2563eb');

  if (isBlackish(color)) color = '#2563eb';

  if (baseFill) {
    try {
      const threshold = 3.0; // más estricto para distinguir en pantalla
      // Si el contraste es bajo o el color es muy similar al base, buscar alternativa
      const needAdjust = contrastRatio(color, baseFill) < threshold;
      if (needAdjust) {
        const start = type ? (hashString(type) % SAFE_PALETTE.length) : (index % SAFE_PALETTE.length);
        let picked = color;
        for (let i = 0; i < SAFE_PALETTE.length; i++) {
          const c = SAFE_PALETTE[(start + i) % SAFE_PALETTE.length];
          if (!isBlackish(c) && contrastRatio(c, baseFill) >= threshold) { picked = c; break; }
        }
        color = picked;
      }
    } catch {}
  }
  return color;
};

export default getEdgeColor;
