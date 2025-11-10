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

// Tooltip: usamos color sólido con opacidad y borde del mismo color

const PiecePreview = ({ piece, original, index, units, onEditPiece, onDeletePiece, onGoToPiece, globalIndex }) => {
  // Hooks deben ir antes de cualquier return condicional
  const containerRef = useRef(null);
  const [tt, setTt] = useState(null);

  const edges = piece.edges ?? {};
  const sidesWithEdge = EDGE_SIDES.filter((side) => Boolean(edges?.[side]?.enabled));

  const longestSide = Math.max(piece.length || piece.largoMm || 0, piece.width || piece.anchoMm || 0);
  const ratio = longestSide > 0 ? Math.min(1, 140 / longestSide) : 1;
  const displayWidth = ((piece.length || piece.largoMm || 0) * ratio) || 100;
  const displayHeight = ((piece.width || piece.anchoMm || 0) * ratio) || 60;
  const quantity = getQuantity(piece);

  const typeToColor = new Map();
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

  const handleDelete = () => {
    if (typeof onDeletePiece === "function") {
      const pieceName = piece.label || piece.nombre || `Pieza ${index + 1}`;
      if (confirm(`¿Estás seguro que quieres borrar "${pieceName}"?`)) {
        // Usar el ID original de la pieza para borrar toda la pieza, no solo una instancia
        const pieceId = original?.originalId || original?.id || piece.id;
        onDeletePiece(pieceId);
      }
    }
  };

  return sidesWithEdge.length === 0 ? null : (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm" key={piece.id ?? index}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onGoToPiece && (
            <button
              onClick={() => onGoToPiece?.(original, globalIndex)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-colors cursor-pointer flex-shrink-0"
              title="Ir al canvas y resaltar esta pieza"
            >
              {globalIndex + 1}
            </button>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text)]">{piece.label || piece.nombre || `Pieza ${index + 1}`}</p>
            <p className="text-xs text-[var(--muted)]">
              {formatValue(piece.length ?? piece.largoMm)} x {formatValue(piece.width ?? piece.anchoMm)} {units}
            </p>
          </div>
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
                background: tt.color || '#2563eb',
                color: '#fff',
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
      {(onEditPiece || onDeletePiece) && (
        <div className="flex justify-center gap-2">
          {onEditPiece && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="text-[var(--text)]">
              Modificar lados
            </Button>
          )}
          {onDeletePiece && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete} 
              className="text-red-600 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 transition-colors"
            >
              Borrar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const EdgeBandingPattern = ({ pieces = [], units = "cm", onEditPiece, onDeletePiece, onGoToPiece }) => {
  // Lista expandida de piezas individuales (usando la misma lógica del EdgeBandingPanel)
  const expandedPieces = useMemo(() => {
    if (!Array.isArray(pieces)) return [];
    
    return pieces.flatMap((p) =>
      Array.from({ length: p.quantity || 1 }, (_, idx) => {
        // Obtener configuración de tapacantos específica para esta instancia
        let instanceEdges;
        if (p.instanceEdges && p.instanceEdges[idx]) {
          instanceEdges = p.instanceEdges[idx];
        } else {
          // Para compatibilidad hacia atrás, usar la configuración base de la pieza
          instanceEdges = p.edges || {};
        }
        
        // Crear etiqueta numerada individualmente
        const baseLabel = p.label || 'Pieza';
        const numberedLabel = p.quantity > 1 ? `${baseLabel} #${idx + 1}` : baseLabel;
        
        return {
          piece: p,
          instance: idx + 1,
          // Pieza virtual con configuración específica de esta instancia
          virtualPiece: {
            ...p,
            id: `${p.id}-${idx}`,
            label: numberedLabel,
            edges: instanceEdges,
            originalId: p.id,
            originalInstance: idx
          }
        };
      })
    );
  }, [pieces]);

  const normalized = useMemo(() => {
    return expandedPieces
      .map(({ virtualPiece }) => {
        const parsed = normalizePiece(virtualPiece, virtualPiece?.units || units);
        return { 
          virtualPiece,
          merged: { ...virtualPiece, ...parsed } 
        };
      })
      .filter(({ merged }) => EDGE_SIDES.some((side) => merged.edges?.[side]?.enabled));
  }, [expandedPieces, units]);

  if (normalized.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-[var(--text)]">Patron de tapacantos</h3>
      <p className="text-xs text-[var(--muted)]">
        Visualiza las piezas que requieren tapacanto y los lados involucrados.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {normalized.map(({ virtualPiece, merged }, index) => {
          // Calcular el índice global usando la misma lógica que en EdgeBandingPanel
          const globalIndex = expandedPieces.findIndex(
            ({ virtualPiece: vp }) => vp.originalId === virtualPiece.originalId && vp.originalInstance === virtualPiece.originalInstance
          );
          
          return (
            <PiecePreview
              key={virtualPiece.id ?? index}
              piece={merged}
              original={virtualPiece} // Pasar la pieza virtual para que el callback funcione correctamente
              index={index}
              units={units}
              onEditPiece={onEditPiece}
              onDeletePiece={onDeletePiece}
              onGoToPiece={onGoToPiece}
              globalIndex={globalIndex >= 0 ? globalIndex : index}
            />
          );
        })}
      </div>
    </div>
  );
};
