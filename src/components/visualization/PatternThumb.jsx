import React, { memo } from 'react';

/**
 * Piece: { x:number; y:number; w:number; h:number } // en mm
 * Pattern: { id:string; widthMm:number; heightMm:number; kerfMm:number; pieces:Piece[] }
 */

function PatternThumbBase({ p }) {
  const width = Math.max(1, Number(p?.widthMm || 0));
  const height = Math.max(1, Number(p?.heightMm || 0));
  const theme = p?.theme || {};

  const darkenHex = (hex, amount = 0.3) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return hex || '#94a3b8';
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

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-1">
      {/* Tablero */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={theme.background || '#eff6ff'}
        stroke={theme.border || '#9bb8d0'}
      />
      {/* Piezas */}
      {(p?.pieces || []).map((r, i) => {
        const color = r.color || (theme.palette && theme.palette.length ? theme.palette[i % theme.palette.length] : '#38bdf8');
        const stroke = darkenHex(color, 0.55);
        return (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={color} fillOpacity={0.82} stroke={stroke} />
        );
      })}
    </svg>
  );
}

export const PatternThumb = memo(PatternThumbBase, (prev, next) => prev.p?.id === next.p?.id);

export default PatternThumb;
