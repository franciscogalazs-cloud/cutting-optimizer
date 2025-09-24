import { normalizePiece } from './pieces.js';

// Tipos de datos para la aplicación de optimización de cortes

export const createPiece = (data = {}, options = {}) => {
  const base = {
    id: data.id || crypto.randomUUID(),
    length: data.length || 0,
    width: data.width || 0,
    quantity: data.quantity || 1,
    label: data.label || '',
    material: data.material || 'Melamina',
    canRotate: data.canRotate !== undefined ? data.canRotate : true,
    priority: data.priority || 1,
    ...data,
  };

  const units = options.units || data.units || 'mm';
  return normalizePiece(base, units);
};

export const createMaterial = (data = {}) => ({
  id: data.id || crypto.randomUUID(),
  length: data.length || 0,
  width: data.width || 0,
  quantity: data.quantity || 1,
  material: data.material || 'Melamina',
  price: data.price || 0,
  kerf: data.kerf || 3, // grosor de sierra en mm
  margin: data.margin || 5, // margen en mm
  ...data,
});

export const createPlacedPiece = (data = {}) => ({
  pieceId: data.pieceId || '',
  x: data.x || 0,
  y: data.y || 0,
  width: data.width || 0,
  height: data.height || 0,
  rotated: data.rotated || false,
  label: data.label || '',
  color: data.color || '#3B82F6',
  ...data,
});

export const createCuttingPattern = (data = {}) => ({
  id: data.id || crypto.randomUUID(),
  materialId: data.materialId || '',
  materialName: data.materialName || '',
  materialLength: data.materialLength || 0,
  materialWidth: data.materialWidth || 0,
  kerf: data.kerf ?? 3,
  margin: data.margin ?? 5,
  pieces: data.pieces || [],
  utilization: data.utilization || 0,
  waste: data.waste || 0,
  cost: data.cost || 0,
  ...data,
});

export const createOptimizationResult = (data = {}) => ({
  patterns: data.patterns || [],
  totalUtilization: data.totalUtilization || 0,
  totalWaste: data.totalWaste || 0,
  totalCost: data.totalCost || 0,
  materialsUsed: data.materialsUsed || 0,
  executionTime: data.executionTime || 0,
  algorithm: data.algorithm || 'Best Fit Decreasing',
  ...data,
});

export const createOptimizationConfig = (data = {}) => ({
  algorithm: data.algorithm || 'bfd', // 'bfd' | 'maxrects' | 'backtracking'
  allowRotation: data.allowRotation !== undefined ? data.allowRotation : true,
  kerf: data.kerf || 3,
  margin: data.margin || 5,
  maxTime: data.maxTime || 30, // segundos
  ...data,
});

// Colores predefinidos para las piezas
export const PIECE_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#8B5A2B', '#6B7280', '#DC2626',
];

// Unidades de medida
export const UNITS = {
  MM: 'mm',
  CM: 'cm',
  INCHES: 'in',
};

// Algoritmos disponibles
export const ALGORITHMS = {
  BFD: 'bfd',
  BESTFIT: 'bestfit',
  BESTFITDECREASING: 'bestfitdecreasing',
  MAXRECTS: 'maxrects',
  BACKTRACKING: 'backtracking',
  BT: 'bt',
};

