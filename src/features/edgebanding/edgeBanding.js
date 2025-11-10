import { EDGE_SIDES, normalizePiece } from '@/types/pieces.js';

/**
 * @typedef {import('@/types/pieces.js').EdgeType} EdgeType
 * @typedef {Record<EdgeType, number>} EdgeTotals
 */

// Nota: 'arriba' y 'abajo' recorren el lado horizontal (largo),
// mientras que 'izquierda' y 'derecha' recorren el lado vertical (ancho).
const sideLengthMm = (piece, side) => {
  if (side === 'arriba' || side === 'abajo') {
    return Number.isFinite(piece?.largoMm) ? piece.largoMm : 0;
  }
  return Number.isFinite(piece?.anchoMm) ? piece.anchoMm : 0;
};

const getQuantity = (piece) => {
  const value = piece?.cantidad ?? piece?.quantity ?? 1;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};

/**
 * Expande las piezas en instancias individuales con su configuración de tapacantos específica
 * Usa la misma lógica que EdgeBandingPanel para consistencia
 */
export const expandPiecesWithEdges = (pieces = []) => {
  return pieces.flatMap((p) =>
    Array.from({ length: getQuantity(p) }, (_, idx) => {
      // Crear una pieza individual con configuración de tapacantos específica para esta instancia
      const instanceKey = `${p.id}-${idx}`;
      
      // Si existe configuración específica para esta instancia, usarla; sino usar la configuración base
      let instanceEdges;
      if (p.instanceEdges && p.instanceEdges[idx]) {
        instanceEdges = p.instanceEdges[idx];
      } else {
        // Para compatibilidad hacia atrás, usar la configuración base de la pieza
        // Asegurar que siempre hay algo, aunque sea un objeto vacío
        instanceEdges = p.edges || {};
      }
      

      
      return {
        ...p,
        id: instanceKey,
        quantity: 1, // Cada instancia expandida tiene cantidad 1
        edges: instanceEdges,
        originalId: p.id,
        originalInstance: idx,
        units: p.units // Preservar las unidades originales
      };
    })
  );
};

export const computeEdgeTotals = (pieces = []) => {
  /** @type {EdgeTotals} */
  const totals = {};
  
  // Las piezas ya vienen expandidas, no expandir de nuevo
  for (const rawPiece of pieces) {
    const piece = normalizePiece(rawPiece, rawPiece?.units || undefined);
    
    const edges = piece.edges;
    if (!edges) continue;
    
    for (const side of EDGE_SIDES) {
      const edge = edges[side];
      if (!edge?.enabled) continue;
      const tipo = edge.tipo ?? 'General';
      const lengthMm = sideLengthMm(piece, side);
      totals[tipo] = (totals[tipo] ?? 0) + lengthMm;
    }
  }
  
  return totals;
};
