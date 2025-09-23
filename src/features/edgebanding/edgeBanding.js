import { EDGE_SIDES, normalizePiece } from '@/types/pieces.js';

/**
 * @typedef {import('@/types/pieces.js').EdgeType} EdgeType
 * @typedef {Record<EdgeType, number>} EdgeTotals
 */

const sideLengthMm = (piece, side) => {
  if (side === 'arriba' || side === 'abajo') {
    return Number.isFinite(piece?.anchoMm) ? piece.anchoMm : 0;
  }
  return Number.isFinite(piece?.largoMm) ? piece.largoMm : 0;
};

const getQuantity = (piece) => {
  const value = piece?.cantidad ?? piece?.quantity ?? 1;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};

export const computeEdgeTotals = (pieces = []) => {
  /** @type {EdgeTotals} */
  const totals = {};
  for (const rawPiece of Array.isArray(pieces) ? pieces : []) {
    const piece = normalizePiece(rawPiece, rawPiece?.units || undefined);
    const quantity = getQuantity(rawPiece);
    const edges = piece.edges;
    if (!edges) continue;
    for (const side of EDGE_SIDES) {
      const edge = edges[side];
      if (!edge?.enabled) continue;
      const tipo = edge.tipo ?? 'General';
      const lengthMm = sideLengthMm(piece, side) * quantity;
      totals[tipo] = (totals[tipo] ?? 0) + lengthMm;
    }
  }
  return totals;
};
