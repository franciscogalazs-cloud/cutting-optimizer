import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EDGE_SIDES, normalizePiece } from "@/types/pieces.js";
import { getEdgeColor as pickEdgeColor } from "@/theme/edge-colors.js";

const SIDE_LABELS = {
  arriba: "Arriba",
  abajo: "Abajo",
  izquierda: "Izquierda",
  derecha: "Derecha",
};

// Colores centralizados se obtienen desde pickEdgeColor

const getQuantity = (piece) => {
  const raw = piece?.quantity ?? piece?.cantidad ?? 1;
  const numeric = Number(raw);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};

const formatValue = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return value ?? "--";
};

// pickEdgeColor ya evita negro y mantiene buena visibilidad

// Utilidades para tooltip simple
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
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  return L > 0.5 ? '#111827' : '#ffffff';
};

const PiecePreview = ({ piece, original, index, units, onEditPiece }) => {
  const edges = piece.edges ?? {};
  const sidesWithEdge = EDGE_SIDES.filter((side) => Boolean(edges?.[side]?.enabled));
  if (sidesWithEdge.length === 0) return null;

  const longestSide = Math.max(piece.length || piece.largoMm || 0, piece.width || piece.anchoMm || 0);
  const ratio = longestSide > 0 ? Math.min(1, 140 / longestSide) : 1;
  const displayWidth = ((piece.length || piece.largoMm || 0) * ratio) || 100;
  const displayHeight = ((piece.width || piece.anchoMm || 0) * ratio) || 60;
  const quantity = getQuantity(piece);

  const typeToColor = new Map();
  const containerRef = useRef(null);
  const [tt, setTt] = useState(null);
  const onEnter = (event, payload) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = event.clientX - (rect?.left ?? 0) + 8;
    const y = event.clientY - (rect?.top ?? 0) + 8;
    setTt({ x, y, ...payload });
  };
  const onMove = (event) => {
    if (!tt) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const x = event.clientX - (rect?.left ?? 0) + 8;
    const y = event.clientY - (rect?.top ?? 0) + 8;
    setTt((prev) => (prev ? { ...prev, x, y } : prev));
  };
  const onLeave = () => setTt(null);

  const handleEdit = () => {
    if (typeof onEditPiece === "function") {
      onEditPiece(original ?? piece);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm" key={piece.id ?? index}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text)]">{piece.label || piece.nombre || `Pieza ${index + 1}`}</p>
          <p className="text-xs text-[var(--muted)]">
            {formatValue(piece.length ?? piece.largoMm)} x {formatValue(piece.width ?? piece.anchoMm)} {units}
          </p>
        </div>
        <Badge variant="outline" className="text-xs text-[var(--muted)]">
          Cantidad: {quantity}
        </Badge>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative rounded-md border border-dashed border-[var(--border)] bg-white/40"
          style={{ width: Math.max(displayWidth, 96), height: Math.max(displayHeight, 60) }}
          ref={containerRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          {sidesWithEdge.map((side, sideIndex) => {
            const edge = edges[side];
            const type = edge?.tipo ?? "General";
            if (!typeToColor.has(type)) {
              // Usar color de pieza para contraste si está disponible
              const baseFill = piece.color || piece.fill || piece.baseColor || undefined;
              typeToColor.set(type, pickEdgeColor(type, sideIndex, baseFill));
            }
            const color = typeToColor.get(type);
            const sideLen = (side === 'arriba' || side === 'abajo')
              ? (piece.length ?? piece.largoMm ?? 0)
              : (piece.width ?? piece.anchoMm ?? 0);
            const baseStyle = {
              position: "absolute",
              backgroundColor: color,
              opacity: tt?.side === side ? 0.95 : 0.6,
              boxShadow: tt?.side === side ? `0 0 0 1px ${color}` : undefined,
            };
            switch (side) {
              case "arriba":
                return (
                  <div
                    key={side}
                    title={`${SIDE_LABELS[side]} - ${type}: ${formatValue(sideLen)} ${units}`}
                    style={{ ...baseStyle, top: 0, left: 0, right: 0, height: 4 }}
                    onMouseEnter={(e) => onEnter(e, { text: `${piece.label || piece.nombre || 'Pieza'} — ${SIDE_LABELS[side]} · ${type} · ${formatValue(sideLen)} ${units}`, color, side })}
                  />
                );
              case "abajo":
                return (
                  <div
                    key={side}
                    title={`${SIDE_LABELS[side]} - ${type}: ${formatValue(sideLen)} ${units}`}
                    style={{ ...baseStyle, bottom: 0, left: 0, right: 0, height: 4 }}
                    onMouseEnter={(e) => onEnter(e, { text: `${piece.label || piece.nombre || 'Pieza'} — ${SIDE_LABELS[side]} · ${type} · ${formatValue(sideLen)} ${units}`, color, side })}
                  />
                );
              case "izquierda":
                return (
                  <div
                    key={side}
                    title={`${SIDE_LABELS[side]} - ${type}: ${formatValue(sideLen)} ${units}`}
                    style={{ ...baseStyle, top: 0, bottom: 0, left: 0, width: 4 }}
                    onMouseEnter={(e) => onEnter(e, { text: `${piece.label || piece.nombre || 'Pieza'} — ${SIDE_LABELS[side]} · ${type} · ${formatValue(sideLen)} ${units}`, color, side })}
                  />
                );
              case "derecha":
                return (
                  <div
                    key={side}
                    title={`${SIDE_LABELS[side]} - ${type}: ${formatValue(sideLen)} ${units}`}
                    style={{ ...baseStyle, top: 0, bottom: 0, right: 0, width: 4 }}
                    onMouseEnter={(e) => onEnter(e, { text: `${piece.label || piece.nombre || 'Pieza'} — ${SIDE_LABELS[side]} · ${type} · ${formatValue(sideLen)} ${units}`, color, side })}
                  />
                );
              default:
                return null;
            }
          })}
          {tt && (
            <div
              className="pointer-events-none absolute z-10 rounded px-2 py-1 text-[10px]"
              style={{
                left: tt.x,
                top: tt.y,
                background: toRgba(tt.color || '#2563eb', 0.2),
                color: textOn(tt.color || '#2563eb'),
                border: `1px solid ${tt.color || '#2563eb'}`,
                backdropFilter: 'blur(2px)'
              }}
            >
              {tt.text}
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {sidesWithEdge.map((side, sideIndex) => {
            const edge = edges[side];
            const type = edge?.tipo ?? "General";
            if (!typeToColor.has(type)) {
              const baseFill = piece.color || piece.fill || piece.baseColor || undefined;
              typeToColor.set(type, pickEdgeColor(type, sideIndex, baseFill));
            }
            const color = typeToColor.get(type);
            return (
              <Badge key={side} style={{ backgroundColor: color, color: "#fff" }}>
                {SIDE_LABELS[side]} - {type}
              </Badge>
            );
          })}
        </div>
      </div>
      {onEditPiece && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleEdit} className="text-[var(--text)]">
            Modificar lados
          </Button>
        </div>
      )}
    </div>
  );
};

export const EdgeBandingPattern = ({ pieces = [], units = "cm", onEditPiece }) => {
  const normalized = useMemo(() => {
    if (!Array.isArray(pieces)) return [];
    return pieces
      .map((piece) => {
        const parsed = normalizePiece(piece, piece?.units || units);
        return { original: piece, merged: { ...piece, ...parsed } };
      })
      .filter(({ merged }) => EDGE_SIDES.some((side) => merged.edges?.[side]?.enabled));
  }, [pieces, units]);

  if (normalized.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-[var(--text)]">Patron de tapacantos</h3>
      <p className="text-xs text-[var(--muted)]">
        Visualiza las piezas que requieren tapacanto y los lados involucrados.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {normalized.map(({ original, merged }, index) => (
          <PiecePreview
            key={original.id ?? index}
            piece={merged}
            original={original}
            index={index}
            units={units}
            onEditPiece={onEditPiece}
          />
        ))}
      </div>
    </div>
  );
};
