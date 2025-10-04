import { useEffect, useRef, useState } from 'react';
import { getEdgeColor as pickEdgeColor } from '@/theme/edge-colors.js';
import { mapEdgesForRotation } from '@/lib/edge-mapping.js';

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
  materialLabel = '',
  showLabels = true,
  showDimensions = true,
  units = 'mm',
  showEdges = true,
  // Permite resaltar una pieza desde el padre (por índice en pattern.pieces)
  highlightPieceIndex = null,
  // Permite resaltar un canto específico desde el padre { pieceIndex, side }
  highlightEdge = null,
}) {
  const canvasRef = useRef(null);
  const edgesRef = useRef([]); // lista de zonas de cantos para hit-test
  const piecesRef = useRef([]); // lista de zonas de piezas para hit-test
  const transformRef = useRef({ s: 1, tx: 0, ty: 0 });
  const [tooltip, setTooltip] = useState(null);
  const hoveredRef = useRef(null);
  const hoveredPieceRef = useRef(null);

  // Utilidades de color para tooltip
  const hexToRgb = (hex) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
      || /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex || '');
    if (!m) return { r: 0, g: 0, b: 0 };
    const r = m[1].length === 1 ? parseInt(m[1] + m[1], 16) : parseInt(m[1], 16);
    const g = m[2].length === 1 ? parseInt(m[2] + m[2], 16) : parseInt(m[2], 16);
    const b = m[3].length === 1 ? parseInt(m[3] + m[3], 16) : parseInt(m[3], 16);
    return { r, g, b };
  };
  const toRgba = (hex, a = 1) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  const textOn = (hex) => {
    // simple luminancia para decidir texto blanco vs gris muy oscuro
    const { r, g, b } = hexToRgb(hex);
    const [R, G, B] = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    return L > 0.5 ? '#111827' : '#ffffff';
  };

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

    // colores de tapacantos se obtienen desde util centralizado

    // Helper: punto en PANTALLA (px) para el centro del lado dentro de la pieza, con offset hacia adentro
    const sideMidScreenPoint = (piece, side, offsetPx = 8) => {
      if (!piece) return { x: 0, y: 0 };
      const { s, tx, ty } = transformRef.current;
      const x = Number(piece.x) || 0;
      const y = Number(piece.y) || 0;
      const w = Number(piece.width) || 0;
      const h = Number(piece.height) || 0;
      // centro del lado en coordenadas MUNDO
      let wx = x + w / 2;
      let wy = y + h / 2;
      const off = offsetPx; // offset en píxeles de pantalla
      if (side === 'arriba') {
        wx = x + w / 2;
        wy = y; // borde superior
        // convertir a pantalla y sumar offset hacia adentro
        return { x: wx * s + tx, y: wy * s + ty + off };
      }
      if (side === 'abajo') {
        wx = x + w / 2;
        wy = y + h; // borde inferior
        return { x: wx * s + tx, y: wy * s + ty - off };
      }
      if (side === 'izquierda') {
        wx = x; // borde izquierdo
        wy = y + h / 2;
        return { x: wx * s + tx + off, y: wy * s + ty };
      }
      if (side === 'derecha') {
        wx = x + w; // borde derecho
        wy = y + h / 2;
        return { x: wx * s + tx - off, y: wy * s + ty };
      }
      return { x: wx * s + tx, y: wy * s + ty };
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
  transformRef.current = { s, tx, ty };

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

      // Etiqueta del material (superior izquierda, fuera del tablero)
      if (materialLabel) {
      // etiqueta de material deshabilitada según requerimiento
      }

      // Piezas
  const edgeZones = [];
  const pieceZones = [];
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
  // Borde más oscuro de la pieza (1px visual) — mismo tono, más oscuro
  ctx.save();
  ctx.lineWidth = 1 / (s * dpr);
  ctx.strokeStyle = darkenHex(fillColor, 0.7);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();

        // Tapacantos (edgebanding) sobre la pieza
  if (showEdges && p.edges) {
          // Remapeo centralizado 90° horario (CW)
          let e = mapEdgesForRotation(p.edges, p.rotated, 'CW');
          const t = 3 / (s * dpr); // grosor a 3px visual para más claridad
          const edges = e || {};
          // arriba

          // Registrar zona de la pieza para hover hit-test y resaltado externo
          pieceZones.push({ x, y, w, h, label: p.label, fill: fillColor, index: i });
          if (edges.arriba?.enabled) {
            const color = pickEdgeColor(edges.arriba?.tipo, 0, fillColor);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.65;
            const th = Math.min(t, h);
            ctx.fillRect(x, y, w, th);
            // trazo sutil para contraste
            ctx.lineWidth = 1 / (s * dpr);
            ctx.strokeStyle = darkenHex(color, 0.4);
            ctx.strokeRect(x, y, w, th);
            ctx.globalAlpha = 1;
            edgeZones.push({ x, y, w, h: th, type: edges.arriba?.tipo || 'General', side: 'arriba', len: w, piece: p.label, pieceIndex: i, color });
          }
          // abajo
          if (edges.abajo?.enabled) {
            const color = pickEdgeColor(edges.abajo?.tipo, 1, fillColor);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.65;
            const th = Math.min(t, h);
            const yy = y + Math.max(0, h - th);
            ctx.fillRect(x, yy, w, th);
            ctx.lineWidth = 1 / (s * dpr);
            ctx.strokeStyle = darkenHex(color, 0.4);
            ctx.strokeRect(x, yy, w, th);
            ctx.globalAlpha = 1;
            edgeZones.push({ x, y: y + Math.max(0, h - Math.min(t, h)), w, h: Math.min(t, h), type: edges.abajo?.tipo || 'General', side: 'abajo', len: w, piece: p.label, pieceIndex: i, color });
          }
          // izquierda
          if (edges.izquierda?.enabled) {
            const color = pickEdgeColor(edges.izquierda?.tipo, 2, fillColor);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.65;
            const tw = Math.min(t, w);
            ctx.fillRect(x, y, tw, h);
            ctx.lineWidth = 1 / (s * dpr);
            ctx.strokeStyle = darkenHex(color, 0.4);
            ctx.strokeRect(x, y, tw, h);
            ctx.globalAlpha = 1;
            edgeZones.push({ x, y, w: Math.min(t, w), h, type: edges.izquierda?.tipo || 'General', side: 'izquierda', len: h, piece: p.label, pieceIndex: i, color });
          }
          // derecha
          if (edges.derecha?.enabled) {
            const color = pickEdgeColor(edges.derecha?.tipo, 3, fillColor);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.65;
            const tw = Math.min(t, w);
            const xx = x + Math.max(0, w - tw);
            ctx.fillRect(xx, y, tw, h);
            ctx.lineWidth = 1 / (s * dpr);
            ctx.strokeStyle = darkenHex(color, 0.4);
            ctx.strokeRect(xx, y, tw, h);
            ctx.globalAlpha = 1;
            edgeZones.push({ x: x + Math.max(0, w - Math.min(t, w)), y, w: Math.min(t, w), h, type: edges.derecha?.tipo || 'General', side: 'derecha', len: h, piece: p.label, pieceIndex: i, color });
          }
        }

        // Etiqueta centrada
        if (showLabels && p.label) {
          const labelPx = 6 * 2; // 2x (más chico que antes)
          const fontPx = labelPx / (s * dpr);
          ctx.font = `${fontPx}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Stroke oscuro suave para contraste (evitar negro puro)
          ctx.lineWidth = (0.625 * 2) / (s * dpr);
          ctx.strokeStyle = 'rgba(17,24,39,0.7)'; // slate-900 con alfa
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

  // Actualizar zonas de cantos para hit-test
  edgesRef.current = edgeZones;
  piecesRef.current = pieceZones;

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

      // Highlight de canto al hover (se dibuja encima)
      const hover = hoveredRef.current;
      if (showEdges && hover) {
        try {
          ctx.save();
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = hover.color || '#2563eb';
          // Dibujar un rectángulo del mismo tamaño para resaltar
          ctx.fillRect(hover.x, hover.y, hover.w, hover.h);
          // Trazo sutil del mismo color
          ctx.lineWidth = 1 / (s * dpr);
          ctx.strokeStyle = hover.color || '#2563eb';
          ctx.strokeRect(hover.x, hover.y, hover.w, hover.h);
          ctx.restore();
        } catch (error) {
          // Ignorar: highlight de canto puede fallar si datos incompletos
          console.warn('Error al dibujar el highlight del canto en hover:', error);
        }
      }

      // Highlight de canto externo (desde lista): siempre que esté activo
      if (showEdges && highlightEdge && Number.isInteger(highlightEdge.pieceIndex) && highlightEdge.side) {
        const ext = edgeZones.find(
          (ez) => ez.pieceIndex === highlightEdge.pieceIndex && ez.side === highlightEdge.side
        );
        if (ext) {
          try {
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = ext.color || '#2563eb';
            ctx.fillRect(ext.x, ext.y, ext.w, ext.h);
            ctx.lineWidth = 1 / (s * dpr);
            ctx.strokeStyle = ext.color || '#2563eb';
            ctx.strokeRect(ext.x, ext.y, ext.w, ext.h);
            ctx.restore();

            // Tooltip externo: mismo texto del chip (tipo y largo)
            const sideMap = { arriba: 'Arriba', abajo: 'Abajo', izquierda: 'Izquierda', derecha: 'Derecha' };
            const pieceName = ext.piece || 'Pieza';
            // Mantener etiqueta Arriba/Abajo si el lado original fue esos, independientemente de rotación
            let displayedSide = ext.side;
            let shownLen = ext.len;
            if (highlightEdge.originalSide) {
              const original = highlightEdge.originalSide;
              // Recalcular largo desde dimensiones de la pieza colocada pero según el lado original
              const piece = Array.isArray(pattern?.pieces) && Number.isInteger(highlightEdge.pieceIndex)
                ? pattern.pieces[highlightEdge.pieceIndex]
                : null;
              if (piece) {
                if (original === 'arriba' || original === 'abajo') {
                  displayedSide = original;
                  shownLen = piece?.rotated ? Number(piece.height) : Number(piece.width);
                } else if (original === 'izquierda' || original === 'derecha') {
                  displayedSide = original;
                  shownLen = piece?.rotated ? Number(piece.width) : Number(piece.height);
                }
              }
            }
            const sideLabel = sideMap[displayedSide] || displayedSide || '';
            const text = `${pieceName} — ${sideLabel} · ${ext.type || 'General'} · ${Number(shownLen).toLocaleString()} ${units}`;
            // colocar DENTRO centrado al lado correspondiente, basado en la pieza
            const piece = Array.isArray(pattern?.pieces) && Number.isInteger(highlightEdge.pieceIndex)
              ? pattern.pieces[highlightEdge.pieceIndex]
              : null;
            const pos = sideMidScreenPoint(piece, ext.side, 8);
            let screenX = pos.x;
            let screenY = pos.y;
            // clamp básico dentro del canvas
            const vw = width;
            const vh = height;
            screenX = Math.max(6, Math.min(vw - 6, screenX));
            screenY = Math.max(6, Math.min(vh - 6, screenY));
            setTooltip({ x: screenX, y: screenY, text, color: ext.color, side: ext.side });
          } catch (error) {
            // Ignorar errores de cálculo de tooltip externo
            console.warn('Error al dibujar el highlight de canto externo:', error);
          }
        }
      } else if (!hover) {
        // Sin hover ni highlight externo: ocultar tooltip
        setTooltip(null);
      }

      // Highlight de pieza al hover (interno del canvas)
      const hoverPiece = hoveredPieceRef.current;
      if (hoverPiece) {
        try {
          ctx.save();
          // velo blanco muy suave encima
          ctx.globalAlpha = 0.14;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(hoverPiece.x, hoverPiece.y, hoverPiece.w, hoverPiece.h);
          // borde sutil más oscuro del color de la pieza
          ctx.globalAlpha = 1;
          ctx.lineWidth = 1.5 / (s * dpr);
          ctx.strokeStyle = darkenHex(hoverPiece.fill, 0.5);
          ctx.strokeRect(hoverPiece.x, hoverPiece.y, hoverPiece.w, hoverPiece.h);
          ctx.restore();
        } catch (error) {
          // Ignorar errores de highlight de pieza interna
          console.warn('Error al dibujar el highlight de pieza en hover:', error);
        }
      }

      // Highlight de pieza externo (desde lista), solo si no hay hover interno
      if (!hoverPiece && Number.isInteger(highlightPieceIndex)) {
        const ext = pieceZones.find((pz) => pz.index === highlightPieceIndex);
        if (ext) {
          try {
            ctx.save();
            ctx.globalAlpha = 0.14;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ext.x, ext.y, ext.w, ext.h);
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1.5 / (s * dpr);
            ctx.strokeStyle = darkenHex(ext.fill, 0.5);
            ctx.strokeRect(ext.x, ext.y, ext.w, ext.h);
            ctx.restore();
          } catch (error) {
            // Ignorar errores de highlight de pieza externo
            console.warn('Error al dibujar el highlight de pieza externo:', error);
          }
        }
      }
    };

    render();
    const onResize = () => render();
    const onMove = (evt) => {
      try {
        // Si hay un highlight externo activo (desde la lista), no interferir
        if (highlightEdge && Number.isInteger(highlightEdge.pieceIndex) && highlightEdge.side) {
          return;
        }
        const { s, tx, ty } = transformRef.current;
        const mx = (evt.offsetX - tx) / s;
        const my = (evt.offsetY - ty) / s;
        const hit = edgesRef.current.find((r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
        if (hit) {
          const sideMap = { arriba: 'Arriba', abajo: 'Abajo', izquierda: 'Izquierda', derecha: 'Derecha' };
          const pieceName = hit.piece || 'Pieza';
          const sideLabel = sideMap[hit.side] || hit.side || '';
          const text = `${pieceName} — ${sideLabel} · ${hit.type || 'General'} · ${Number(hit.len).toLocaleString()} ${units}`;
          hoveredRef.current = hit;
          hoveredPieceRef.current = null;

          // Posicionar tooltip centrado en su costado usando la geometría de la pieza
          const piece = Array.isArray(pattern?.pieces) && Number.isInteger(hit.pieceIndex)
            ? pattern.pieces[hit.pieceIndex]
            : null;
          const pos = sideMidScreenPoint(piece, hit.side, 8);
          let screenX = pos.x;
          let screenY = pos.y;
          // Clamp dentro del canvas visual
          const vw = width;
          const vh = height;
          screenX = Math.max(6, Math.min(vw - 6, screenX));
          screenY = Math.max(6, Math.min(vh - 6, screenY));

          setTooltip({ x: screenX, y: screenY, text, color: hit.color, side: hit.side });
          render();
        } else {
            hoveredRef.current = null;
            // Si no hay canto, probar si estamos sobre una pieza
            const pz = piecesRef.current.find((r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
            if (pz) {
              hoveredPieceRef.current = pz;
              setTooltip(null);
              render();
            } else {
              hoveredPieceRef.current = null;
              setTooltip(null);
              render();
            }
        }
      } catch (error) {
        console.warn('Error en el evento onMove del canvas:', error);
        hoveredRef.current = null;
        hoveredPieceRef.current = null;
        setTooltip(null);
      }
    };
    const onLeave = () => {
      hoveredRef.current = null;
      hoveredPieceRef.current = null;
      setTooltip(null);
      render();
    };
    cv.addEventListener('mousemove', onMove);
    cv.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);
    const id = setInterval(() => {
      // handle dpr changes (zooming) in some browsers
      render();
    }, 500);
    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(id);
      cv.removeEventListener('mousemove', onMove);
      cv.removeEventListener('mouseleave', onLeave);
    };
  }, [pattern, theme, width, height, paddingPx, materialLabel, showLabels, showDimensions, units, showEdges, highlightPieceIndex, highlightEdge, tooltip]);

  return (
    <div
      className="relative rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
      style={{ width, height }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-sm px-1 py-0.5 text-[10px] leading-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform:
              tooltip.side === 'arriba'
                ? 'translate(-50%, 0)'
                : tooltip.side === 'abajo'
                ? 'translate(-50%, -100%)'
                : tooltip.side === 'izquierda'
                ? 'translate(0, -50%)'
                : tooltip.side === 'derecha'
                ? 'translate(-100%, -50%)'
                : 'translate(-50%, -50%)',
            background: tooltip.color ? toRgba(tooltip.color, 0.2) : 'rgba(37,99,235,0.2)',
            color: tooltip.color ? textOn(tooltip.color) : '#111827',
            border: `1px solid ${tooltip.color || '#2563eb'}`,
            backdropFilter: 'blur(2px)'
          }}
        >
          <span
            style={{
              writingMode: tooltip.side === 'izquierda' || tooltip.side === 'derecha' ? 'vertical-rl' : 'horizontal-tb',
              textOrientation: 'mixed',
              display: 'inline-block',
              whiteSpace: 'nowrap'
            }}
          >
            {tooltip.text}
          </span>
        </div>
      )}
    </div>
  );
}
