import { MaxRectsOptimizer } from './maxRectsOptimizer.js';
import { BacktrackingOptimizer } from './backtrackingOptimizer.js';
import { createCuttingPattern, createPlacedPiece } from '../types/index.js';

export class HybridOptimizer {
  constructor(config = {}) {
    this.config = {
      ...config,
    };
    this.maxRects = new MaxRectsOptimizer(this.config);
    this.backtracking = new BacktrackingOptimizer(this.config);
  }

  optimize(pieces, materials) {
    const gridResult = this.tryGridPacking(pieces, materials);
    if (gridResult) {
      return gridResult;
    }

    const baseline = this.maxRects.optimize(pieces, materials);
    const improved = this.backtracking.optimize(pieces, materials, { initialResult: baseline });

    const best = improved.totalWaste <= baseline.totalWaste ? improved : baseline;
    return {
      ...best,
      algorithm: 'Hybrid (MaxRects + Backtracking)',
    };
  }

  tryGridPacking(pieces, materials) {
    if (!Array.isArray(materials) || materials.length !== 1) return null;

    const material = materials[0];
    const margin = material.margin ?? this.config.margin ?? 0;
    const kerf = material.kerf ?? this.config.kerf ?? 0;
    if (kerf !== 0 || margin !== 0) return null;

    const expandedPieces = this.backtracking.expandPieces(pieces);
    if (expandedPieces.length === 0) {
      return this.createResult([], materials, 'Grid Packing');
    }

    const reference = expandedPieces[0];
    const allSame = expandedPieces.every((piece) => (
      Math.abs(piece.length - reference.length) <= 1e-6
      && Math.abs(piece.width - reference.width) <= 1e-6
      && (piece.canRotate ?? true)
    ));

    if (!allSame) return null;
    if (reference.material && material.material && reference.material !== material.material) {
      return null;
    }

    const pieceLength = reference.length;
    const pieceWidth = reference.width;
    const totalPieces = expandedPieces.length;

    const orientations = [
      {
        rotated: false,
        countX: Math.floor(material.length / pieceLength),
        countY: Math.floor(material.width / pieceWidth),
        stepX: pieceLength,
        stepY: pieceWidth,
      },
      {
        rotated: true,
        countX: Math.floor(material.length / pieceWidth),
        countY: Math.floor(material.width / pieceLength),
        stepX: pieceWidth,
        stepY: pieceLength,
      },
    ];

    const feasibleOrientations = orientations
      .map((option) => ({ ...option, capacity: option.countX * option.countY }))
      .filter((option) => option.capacity > 0);

    if (feasibleOrientations.length === 0) return null;

    const preferred = feasibleOrientations
      .filter((option) => option.capacity >= totalPieces)
      .sort((a, b) => a.capacity - b.capacity)[0]
      ?? feasibleOrientations.sort((a, b) => b.capacity - a.capacity)[0];

    if (!preferred || preferred.capacity < totalPieces) return null;

    const pattern = createCuttingPattern({
      materialId: material.id,
      materialName: material.material,
      materialLength: material.length,
      materialWidth: material.width,
      kerf: material.kerf ?? this.config.kerf ?? 0,
      margin: material.margin ?? this.config.margin ?? 0,
      pieces: [],
    });

    let placedCount = 0;
    const piecesQueue = [...expandedPieces];

    outer: for (let y = 0; y < preferred.countY; y++) {
      for (let x = 0; x < preferred.countX; x++) {
        if (placedCount >= totalPieces) break outer;
        const piece = piecesQueue[placedCount];
        const placedPiece = createPlacedPiece({
          pieceId: piece.id,
          x: pattern.margin + x * preferred.stepX,
          y: pattern.margin + y * preferred.stepY,
          width: preferred.stepX,
          height: preferred.stepY,
          rotated: preferred.rotated,
          label: piece.label,
          color: piece.color,
        });
        pattern.pieces.push(placedPiece);
        placedCount++;
      }
    }

    if (placedCount !== totalPieces) return null;

    return this.createResult([pattern], materials, 'Grid Packing');
  }

  createResult(patterns, materials, algorithmName) {
    const evaluatedPatterns = patterns.map((pattern) => {
      const materialArea = pattern.materialLength * pattern.materialWidth;
      const usedArea = (pattern.pieces || []).reduce((sum, piece) => sum + (piece.width * piece.height), 0);
      const waste = Math.max(0, materialArea - usedArea);
      const utilization = materialArea > 0 ? (usedArea / materialArea) * 100 : 0;
      const sourceMaterial = materials.find((mat) => mat.id === pattern.materialId);
      return {
        ...pattern,
        utilization,
        waste,
        cost: sourceMaterial?.price ?? pattern.cost ?? 0,
      };
    });

    const totalWaste = evaluatedPatterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const totalUtilization = evaluatedPatterns.length
      ? evaluatedPatterns.reduce((sum, pattern) => sum + pattern.utilization, 0) / evaluatedPatterns.length
      : 0;
    const totalCost = evaluatedPatterns.reduce((sum, pattern) => sum + (pattern.cost || 0), 0);

    return {
      patterns: evaluatedPatterns,
      totalUtilization,
      totalWaste,
      totalCost,
      materialsUsed: evaluatedPatterns.length,
      executionTime: 0,
      algorithm: algorithmName,
    };
  }
}
