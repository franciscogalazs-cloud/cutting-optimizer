// Utility types and helpers for piece edge banding

/**
 * @typedef {'General' | 'Grueso' | 'Delgado' | '0.45mm' | '1mm' | '2mm' | string} EdgeType
 */

/**
 * @typedef {{ enabled: boolean; tipo: EdgeType | null }} EdgeInfo
 */

/**
 * @typedef {{
 *   arriba: EdgeInfo;
 *   abajo: EdgeInfo;
 *   izquierda: EdgeInfo;
 *   derecha: EdgeInfo;
 * }} PieceEdges
 */

export const EDGE_SIDES = ['arriba', 'abajo', 'izquierda', 'derecha'];

export const EDGE_TYPE_OPTIONS = ['General', 'Grueso', 'Delgado', '0.45mm', '1mm', '2mm'];

export const defaultEdges = Object.freeze({
  arriba: { enabled: false, tipo: null },
  abajo: { enabled: false, tipo: null },
  izquierda: { enabled: false, tipo: null },
  derecha: { enabled: false, tipo: null },
});

export const cloneEdges = (edges) => {
  const source = edges ?? defaultEdges;
  const next = {};
  for (const side of EDGE_SIDES) {
    const info = source?.[side];
    next[side] = {
      enabled: Boolean(info?.enabled),
      tipo: info?.tipo ?? null,
    };
  }
  return next;
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const toMillimeters = (value, units = 'mm') => {
  const numeric = toNumber(value);
  switch (units) {
    case 'cm':
      return numeric * 10;
    case 'in':
      return numeric * 25.4;
    default:
      return numeric;
  }
};

export const normalizePiece = (piece = {}, units = 'mm') => {
  const normalized = { ...piece };
  normalized.edges = cloneEdges(piece?.edges);
  if (piece?.largoMm != null && Number.isFinite(Number(piece.largoMm))) {
    normalized.largoMm = Number(piece.largoMm);
  } else {
    normalized.largoMm = toMillimeters(piece?.length, units);
  }
  if (piece?.anchoMm != null && Number.isFinite(Number(piece.anchoMm))) {
    normalized.anchoMm = Number(piece.anchoMm);
  } else {
    normalized.anchoMm = toMillimeters(piece?.width, units);
  }
  return normalized;
};

export const ensurePieceHasEdges = (piece = {}, units = 'mm') => normalizePiece(piece, units);
