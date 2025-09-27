import { useEffect, useRef } from 'react';

/**
 * Canvas 2D demo renderer using devicePixelRatio-aware transform.
 * Fixed frame by default: 820x520 with red border, as per user's snippet.
 */
export default function PatternCanvas2D({
  pattern,
  theme,
  width = 820,
  height = 520,
  paddingPx = 24,
  showLabels = true,
  showDimensions = true,
  units = 'mm',
  showEdges = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !pattern) return;
    const ctx = cv.getContext('2d');

    const darkenHex = (hex, amount = 0.2) => {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
      if (!m) return hex || '#0f172a';
      const to255 = (h) => Math.max(0, Math.min(255, parseInt(h, 16)));
      let r = to255(m[1]);
      let g = to255(m[2]);
      let b = to255(m[3]);
      r = Math.round(r * (1 - amount));
      g = Math.round(g * (1 - amount));
      b = Math.round(b * (1 - amount));
      const toHex = (v) => v.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const EDGE_TYPE_COLORS = {
      General: '#111827', // slate-900
      Grueso: '#0f766e',  // teal-700
      Delgado: '#dc2626', // red-600
      '0.45mm': '#7c3aed', // violet-600
      '1mm': '#065f46',   // emerald-800
      '2mm': '#1d4ed8',   // blue-700
    };
    const pickEdgeColor = (type, index = 0, baseFill = '#ffffff') => {
      // base por tipo
      let color = (type && EDGE_TYPE_COLORS[type]) ? EDGE_TYPE_COLORS[type] : Object.values(EDGE_TYPE_COLORS)[index % Object.values(EDGE_TYPE_COLORS).length] || '#111827';
      // asegurar contraste con el fill de la pieza
      try {
        const contrast = (c1, c2) => {
          const hexToRgb = (h) => {
            const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
            if (!m) return { r: 0, g: 0, b: 0 };
            return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
          };
          const luminance = ({ r, g, b }) => {
            const srgb = [r, g, b].map((v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            const [R, G, B] = srgb;
            return 0.2126 * R + 0.7152 * G + 0.0722 * B;
          };
          const L1 = luminance(hexToRgb(c1)) + 0.05;
          const L2 = luminance(hexToRgb(c2)) + 0.05;
          return L1 > L2 ? L1 / L2 : L2 / L1;
        };
        if (contrast(color, baseFill) < 2.5) {
          // si hay poco contraste, usar negro puro o blanco según convenga
          const useBlack = contrast('#000000', baseFill) >= contrast('#ffffff', baseFill);
          color = useBlack ? '#000000' : '#ffffff';
        }
      } catch {}
      return color;
    };

    const render = () => {
      const vw = width;
      const vh = height;
      const dpr = window.devicePixelRatio || 1;
      cv.width = vw * dpr;
      cv.height = vh * dpr;
      cv.style.width = `${vw}px`;
      cv.style.height = `${vh}px`;

      const sheetW = Number(pattern.materialLength) || 0;
      const sheetH = Number(pattern.materialWidth) || 0;
      if (sheetW <= 0 || sheetH <= 0) return;

      const s = Math.min((vw - 2 * paddingPx) / sheetW, (vh - 2 * paddingPx) / sheetH);
      const tx = (vw - sheetW * s) / 2;
      const ty = (vh - sheetH * s) / 2;

      ctx.setTransform(s * dpr, 0, 0, s * dpr, tx * dpr, ty * dpr);
      // Limpiar todo el frame en coordenadas de pantalla
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, vw * dpr, vh * dpr);
      ctx.restore();

      // Fondo tablero
      ctx.fillStyle = theme?.background || '#e6f3ff';
  ctx.strokeStyle = theme?.border || '#9bb8d0';
  ctx.lineWidth = 1 / (s * dpr); // 1px visual
      ctx.fillRect(0, 0, sheetW, sheetH);
      ctx.strokeRect(0, 0, sheetW, sheetH);

      // Piezas
      const pieces = Array.isArray(pattern.pieces) ? pattern.pieces : [];
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        const fillColor = p.color || (theme?.palette ? theme.palette[i % theme.palette.length] : '#ef4444');
        ctx.fillStyle = fillColor;
        const x = Number(p.x) || 0;
        const y = Number(p.y) || 0;
        const w = Number(p.width) || 0;
        const h = Number(p.height) || 0;
  ctx.globalAlpha = 0.82;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  // Borde más oscuro de la pieza (1px visual)
  ctx.save();
  ctx.lineWidth = 1 / (s * dpr);
  ctx.strokeStyle = darkenHex(fillColor, 0.5);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();

        // Tapacantos (edgebanding) sobre la pieza
        if (showEdges && p.edges) {
          // Remapeo fijo 90° antihorario (CCW) si la pieza viene rotada
          let e = p.rotated
            ? {
                arriba: p.edges?.derecha,
                derecha: p.edges?.abajo,
                abajo: p.edges?.izquierda,
                izquierda: p.edges?.arriba,
              }
            : p.edges;
          const t = 4 / (s * dpr); // grosor más delgado en pantalla
          const edges = e || {};
          // arriba
          if (edges.arriba?.enabled) {
            const color = pickEdgeColor(edges.arriba?.tipo, 0, fillColor);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x, y, w, Math.min(t, h));
            ctx.globalAlpha = 1;
          }
          // abajo
          if (edges.abajo?.enabled) {
            const color = pickEdgeColor(edges.abajo?.tipo, 1, fillColor);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x, y + Math.max(0, h - t), w, Math.min(t, h));
            ctx.globalAlpha = 1;
          }
          // izquierda
          if (edges.izquierda?.enabled) {
            const color = pickEdgeColor(edges.izquierda?.tipo, 2, fillColor);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x, y, Math.min(t, w), h);
            ctx.globalAlpha = 1;
          }
          // derecha
          if (edges.derecha?.enabled) {
            const color = pickEdgeColor(edges.derecha?.tipo, 3, fillColor);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x + Math.max(0, w - t), y, Math.min(t, w), h);
            ctx.globalAlpha = 1;
          }
        }

        // Etiqueta centrada
        if (showLabels && p.label) {
          const labelPx = 6 * 2; // 2x (más chico que antes)
          const fontPx = labelPx / (s * dpr);
          ctx.font = `${fontPx}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Stroke oscuro suave para contraste
          ctx.lineWidth = (0.625 * 2) / (s * dpr);
          ctx.strokeStyle = 'rgba(0,0,0,0.7)';
          ctx.fillStyle = '#ffffff';
          const cx = x + w / 2;
          const cy = y + h / 2;
          ctx.save();
          ctx.globalAlpha = 0.8; // etiqueta ligeramente transparente
          ctx.strokeText(String(p.label), cx, cy);
          ctx.fillText(String(p.label), cx, cy);
          ctx.restore();
        }

        // Símbolo de rotación
        if (p.rotated) {
          const cx = x + 6;
          const cy = y + 6;
          const rPx = 9; // círculo más chico que el símbolo
          const r = rPx / (s * dpr);
          const dimColor = darkenHex(fillColor, 0.2);
          // círculo blanco translúcido
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          // símbolo
          const symPx = 10 * 2; // mitad del tamaño previo
          ctx.font = `${symPx / (s * dpr)}px sans-serif`;
          ctx.fillStyle = dimColor;
          ctx.globalAlpha = 0.6;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('↻', cx, cy);
          ctx.globalAlpha = 1;
        }

        // Dimensiones
        if (showDimensions) {
          const dimPx = 5 * 2; // 2x (más chico que antes)
          const fontPx = dimPx / (s * dpr);
          const dimColor = darkenHex(fillColor, 0.2);
          ctx.font = `${fontPx}px sans-serif`;
          ctx.fillStyle = dimColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          // Ancho en la parte superior
          ctx.fillText(`${Number.isFinite(w) ? w : ''} ${units}`, x + w / 2, y + (2 / (s * dpr)));
          // Alto rotado en el lateral izquierdo
          ctx.save();
          const leftX = x + (6 / (s * dpr));
          const midY = y + h / 2;
          ctx.translate(leftX, midY);
          ctx.rotate((-90 * Math.PI) / 180);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Number.isFinite(h) ? h : ''} ${units}`, 0, 0);
          ctx.restore();
        }
      }

      // Medidas del tablero (si dimensiones activas), por fuera del tablero
      if (showDimensions) {
        const dimPx = 5 * 2; // 2x
        const fontPx = dimPx / (s * dpr);
        const offPx = 10; // separación hacia afuera en px pantalla
        const off = offPx / (s * dpr);

        ctx.font = `${fontPx}px sans-serif`;
        ctx.fillStyle = '#334155'; // slate-700
        ctx.textAlign = 'center';

        // Ancho del tablero por fuera (arriba)
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${Number.isFinite(sheetW) ? sheetW : ''} ${units}`, sheetW / 2, -off);

        // Alto del tablero por fuera (izquierda, rotado)
        ctx.save();
        const leftX = -off;
        const midY = sheetH / 2;
        ctx.translate(leftX, midY);
        ctx.rotate((-90 * Math.PI) / 180);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Number.isFinite(sheetH) ? sheetH : ''} ${units}`, 0, 0);
        ctx.restore();
      }
    };

    render();
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    const id = setInterval(() => {
      // handle dpr changes (zooming) in some browsers
      render();
    }, 500);
    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(id);
    };
  }, [pattern, theme, width, height, paddingPx, showLabels, showDimensions, units, showEdges]);

  return (
    <div
      className="relative rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
      style={{ width, height }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
