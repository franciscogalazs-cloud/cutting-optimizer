import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EDGE_SIDES, normalizePiece } from "@/types/pieces.js";

const SIDE_LABELS = {
  arriba: "Arriba",
  abajo: "Abajo",
  izquierda: "Izquierda",
  derecha: "Derecha",
};

const EDGE_TYPE_COLORS = {
  General: "#3B82F6",
  Grueso: "#F97316",
  Delgado: "#10B981",
  "0.45mm": "#6366F1",
  "1mm": "#F43F5E",
  "2mm": "#0EA5E9",
};

const DEFAULT_COLOR = "#0EA5E9";

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

const pickColor = (type, index) => {
  if (type && EDGE_TYPE_COLORS[type]) {
    return EDGE_TYPE_COLORS[type];
  }
  const palette = Object.values(EDGE_TYPE_COLORS);
  return palette[index % palette.length] || DEFAULT_COLOR;
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
        >
          {sidesWithEdge.map((side, sideIndex) => {
            const edge = edges[side];
            const type = edge?.tipo ?? "General";
            if (!typeToColor.has(type)) {
              typeToColor.set(type, pickColor(type, sideIndex));
            }
            const color = typeToColor.get(type);
            const baseStyle = {
              position: "absolute",
              backgroundColor: color,
              opacity: 0.75,
            };
            switch (side) {
              case "arriba":
                return <div key={side} style={{ ...baseStyle, top: 0, left: 0, right: 0, height: 6 }} />;
              case "abajo":
                return <div key={side} style={{ ...baseStyle, bottom: 0, left: 0, right: 0, height: 6 }} />;
              case "izquierda":
                return <div key={side} style={{ ...baseStyle, top: 0, bottom: 0, left: 0, width: 6 }} />;
              case "derecha":
                return <div key={side} style={{ ...baseStyle, top: 0, bottom: 0, right: 0, width: 6 }} />;
              default:
                return null;
            }
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {sidesWithEdge.map((side, sideIndex) => {
            const edge = edges[side];
            const type = edge?.tipo ?? "General";
            if (!typeToColor.has(type)) {
              typeToColor.set(type, pickColor(type, sideIndex));
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
