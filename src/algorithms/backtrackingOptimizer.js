// Algoritmo de optimización 2D con backtracking (versión inicial)
// Busca la mejor disposición global de piezas en el material
import { createPlacedPiece, createCuttingPattern, PIECE_COLORS } from '../types/index.js';

export class BacktrackingOptimizer {
  constructor(config = {}) {
    this.config = {
      kerf: config.kerf ?? 3,
      margin: config.margin ?? 5,
      allowRotation: config.allowRotation ?? true,
      ...config,
    };
  }

  optimize(pieces, materials) {
    const expandedPieces = this.expandPieces(pieces);
    const sortedPieces = this.sortPiecesByArea(expandedPieces);
    const availableMaterials = materials.map(m => ({ ...m }));
    const bestResult = { patterns: [], totalWaste: Infinity };
    this.backtrack(sortedPieces, availableMaterials, [], bestResult);
    bestResult.totalUtilization = bestResult.patterns.length > 0
      ? bestResult.patterns.reduce((sum, p) => sum + p.utilization, 0) / bestResult.patterns.length
      : 0;
    bestResult.totalCost = bestResult.patterns.reduce((sum, p) => sum + (p.cost || 0), 0);
    bestResult.materialsUsed = bestResult.patterns.length;
    bestResult.executionTime = 0;
    bestResult.algorithm = 'Backtracking';
    return bestResult;
  }

  expandPieces(pieces) {
    const expanded = [];
    let colorIndex = 0;
    pieces.forEach(piece => {
      for (let i = 0; i < piece.quantity; i++) {
        expanded.push({
          ...piece,
          id: `${piece.id}_${i}`,
          originalId: piece.id,
          color: PIECE_COLORS[colorIndex % PIECE_COLORS.length],
          instanceNumber: i + 1,
        });
      }
      colorIndex++;
    });
    return expanded;
  }

  sortPiecesByArea(list) {
    return list.sort((a, b) => (b.length * b.width) - (a.length * a.width));
  }

  backtrack(pieces, materials, currentPatterns, bestResult) {
    if (pieces.length === 0) {
      // Todas las piezas colocadas, calcular desperdicio
      const totalWaste = currentPatterns.reduce((sum, p) => sum + (p.materialLength * p.materialWidth - p.pieces.reduce((s, pc) => s + pc.width * pc.height, 0)), 0);
      if (totalWaste < bestResult.totalWaste) {
        bestResult.patterns = JSON.parse(JSON.stringify(currentPatterns));
        bestResult.totalWaste = totalWaste;
      }
      return;
    }
    // Limitar profundidad para evitar explosión combinatoria (opcional)
    if (currentPatterns.length > 3) return;
    const piece = pieces[0];
    // Probar en todos los patrones existentes
    for (let i = 0; i < currentPatterns.length; i++) {
      const pattern = currentPatterns[i];
      const positions = this.generatePossiblePositions(pattern, piece);
      for (const pos of positions) {
        const placedPiece = this.tryPlacePiece(piece, pattern, pos);
        if (placedPiece) {
          pattern.pieces.push(placedPiece);
          this.backtrack(pieces.slice(1), materials, currentPatterns, bestResult);
          pattern.pieces.pop();
        }
      }
    }
    // Probar en un nuevo patrón/material
    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      if (material.quantity > 0 && (!piece.material || piece.material === material.material)) {
        const pattern = createCuttingPattern({
          materialId: material.id,
          materialName: material.material,
          materialLength: material.length,
          materialWidth: material.width,
          kerf: material.kerf ?? this.config.kerf,
          margin: material.margin ?? this.config.margin,
          pieces: [],
        });
        const positions = this.generatePossiblePositions(pattern, piece);
        for (const pos of positions) {
          const placedPiece = this.tryPlacePiece(piece, pattern, pos);
          if (placedPiece) {
            pattern.pieces.push(placedPiece);
            material.quantity--;
            currentPatterns.push(pattern);
            this.backtrack(pieces.slice(1), materials, currentPatterns, bestResult);
            currentPatterns.pop();
            material.quantity++;
            pattern.pieces.pop();
          }
        }
      }
    }
  }

  generatePossiblePositions(pattern, piece) {
    const margin = this.getMargin(pattern);
    const kerf = this.getKerf(pattern);
    const positions = [{ x: margin, y: margin, rotated: false }];
    if (this.config.allowRotation) {
      positions.push({ x: margin, y: margin, rotated: true });
    }
    for (const placedPiece of pattern.pieces) {
      // Esquinas de cada pieza
      positions.push({ x: placedPiece.x + placedPiece.width + kerf, y: placedPiece.y, rotated: false });
      positions.push({ x: placedPiece.x, y: placedPiece.y + placedPiece.height + kerf, rotated: false });
      if (this.config.allowRotation) {
        positions.push({ x: placedPiece.x + placedPiece.height + kerf, y: placedPiece.y, rotated: true });
        positions.push({ x: placedPiece.x, y: placedPiece.y + placedPiece.width + kerf, rotated: true });
      }
    }
    // Eliminar duplicados
    const unique = [];
    const seen = new Set();
    for (const pos of positions) {
      const key = `${pos.x},${pos.y},${pos.rotated}`;
      if (!seen.has(key)) {
        unique.push(pos);
        seen.add(key);
      }
    }
    return unique;
  }

  tryPlacePiece(piece, pattern, pos) {
    const margin = this.getMargin(pattern);
    const kerf = this.getKerf(pattern);
    const materialLength = pattern.materialLength - margin * 2;
    const materialWidth = pattern.materialWidth - margin * 2;
    let length = pos.rotated ? piece.width : piece.length;
    let width = pos.rotated ? piece.length : piece.width;
    if (pos.x + length > materialLength + margin || pos.y + width > materialWidth + margin) return null;
    for (const placedPiece of pattern.pieces) {
      if (this.rectanglesOverlap(
        pos.x, pos.y, length, width,
        placedPiece.x - kerf / 2,
        placedPiece.y - kerf / 2,
        placedPiece.width + kerf,
        placedPiece.height + kerf,
      )) return null;
    }
    return createPlacedPiece({
      pieceId: piece.id,
      x: pos.x,
      y: pos.y,
      width: length,
      height: width,
      rotated: pos.rotated,
      label: piece.label,
      color: piece.color,
    });
  }

  rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
  }

  getKerf(pattern) {
    return pattern?.kerf ?? this.config.kerf;
  }

  getMargin(pattern) {
    return pattern?.margin ?? this.config.margin;
  }
}
